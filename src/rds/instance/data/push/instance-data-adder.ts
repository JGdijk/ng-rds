import {InstanceData} from "../instance-data";
import {Collector} from "../../../collector/collector";
import {vault} from "../../../vault/vault";
import {JoinStatement} from "../../../statements/join-statement";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {AddCollector} from "../../../collector/collectors/add-collector";
import {ProcessUnit} from "../../../process/process-unit";
import {InstanceDataPusherInterface} from "../instance-data-pusher.interface";

export class InstanceDataAdder {

    private data: InstanceData;

    private collector: Collector;

    private addCollector: AddCollector;

    private newData: any[];

    constructor(instanceData: InstanceData) {
        this.data = instanceData;
    }

    public run(processUnit: ProcessUnit): any[] {

        //if non of the added keys matches the instance's return false
        if (!this.checkKeys(processUnit.collector)) return;

        //set the collector
        this.init(processUnit);

        //checks if any of the main data needs to be added directly
        this.processTarget();

        //checks if any data changes according to any relation connected to this instance;
        this.processRelations();

        return this.newData;
    }

    private init(processUnit: ProcessUnit): void {
        this.collector = processUnit.collector;
        this.addCollector = processUnit.collector.use('add');
        this.newData = processUnit.data;
    }

    private processTarget(): void {

        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!this.addCollector.has(key)) return;

        let data = this.addCollector.copy(key);

        // check if it matches any id's
        if (this.data.hasIds()) {
            data = this.filterIds(data);
        }

        //filters all the parent data on set where conditions
        data = this.data.whereStatementController.filter(data);

        //if by this point we have no results anymore move on
        if (!data.length) return;

        //we now know that there will be something added and thus we have to return true;
        this.collector.setChecked();

        //we add the remaining objects to the actual data
        let model = vault.get(key).model;

        let primaryKey = vault.get(key).primaryKey;

        let keys: string[] = this.data.joinStatementController.objectKeys();

        // we have to determine which objects are already in the array (overwritten) and which are truly new
        let newData: any[] = [];
        let replaceData: any[] = [];

        // divide the objects
        dataLoop: for (let obj of data) {
            for (let currentObj of this.newData) {
                if (currentObj[primaryKey] === obj[primaryKey]) {
                    replaceData.push(obj);
                    continue dataLoop;
                }
            }
            newData.push(obj);
        }

        let array: any[] = [];

        // first we add the new items
        for (let obj of newData) {
            array.push(this.data.joinStatementController.attach(new model(obj)))
        }

        // secondly we check of every exiting object if it can be pushed or replaced by a new object
        existingLoop: for (let currentObj of data) {
            for (let obj of replaceData) {
                if (currentObj[primaryKey] === obj[primaryKey]) {
                    //makes a new model and transfers the relations
                    let newModel = new model(obj);
                    newModel = this.transferRelations(keys, currentObj, newModel);

                    array.push(newModel);
                    continue existingLoop;
                }
            }

            array.push(currentObj);
        }

        this.newData = this.orderArray(this.data, array);
    }

    private processRelations(): void {
        if (!this.data.joinStatementController.has()) return;

        let result = this.checkRelationData(this.data, this.newData);

        if (result) {
            this.newData = result;
        }
    }

    /**
     * Receives the data that needs to be checked and adjusted only if it has any relations.
     * If it has relations (controller) then we are going to pass trough the objects.
     * The data can either be an array of objects or just a single object.
     *
     * We will return the newly made data if any changes have been made. This function doesn't know what will happen
     * with the newly made data.
     */
    private checkRelationData(controller: InstanceDataPusherInterface, data: any): any {
        if (!controller.joinStatementController || !controller.joinStatementController.has()) return;

        return (Array.isArray(data))
            ? this.checkRelationDataArray(controller, data)
            : this.checkRelationDataObject(controller, data)
    }

    /**
     * If the data is an object we are going to make a new object in case any of its relations will be adjusted.
     * Because we want our data to be immutable the original object also needs to be changed. We will only return this
     * newly created object if the data has actually changed.
     *
     * We check for every relation if it the data needs to be changed. If any of the relations has been changed, check
     * will be true and we will return the newly created object with it's new relation data.
     */
    private checkRelationDataObject(controller: InstanceDataPusherInterface, dataObject: any): any {
        // if there is no object simply return;
        if (!dataObject) return;

        let joinController: JoinStatementController = controller.joinStatementController;

        let check: boolean;
        let newObj: any = Object.assign({}, dataObject);

        // all the different relations if they exist
        for (let statement of joinController.get()) {

            // this will return us the changed relation data (if adjusted)
            let result: any = this.checkRelationStatement(statement, newObj);

            // if the relation is not affected continue
            if (!result) continue;

            // if the relation is affected we add the relation to the object;
            check = true;
            newObj[statement.objectKey()] = result;
        }

        // if any of the relations has changed we will send back the new object as a new model;
        if (check) {
            this.collector.setChecked();
            let model: any = vault.get(joinController.origin).model;
            return new model(newObj);
        }
    }

    /**
     * If the data is an array we will make an array in case any adjustments have been made to any of its objects.
     * This new array will only be returned if any of its object has been adjusted.
     */
    private checkRelationDataArray(controller: InstanceDataPusherInterface, dataArray: any[]): any[] {

        let joinController: JoinStatementController = controller.joinStatementController;

        let array: any[] = [];
        let check: boolean;

        // goes over every object in the array
        for (let obj of dataArray) {

            let innerCheck: boolean = false;
            // we transfer this to a new object so that we will always be working with the adjust object
            let innerObj: any = obj;

            // goes over every statement
            for (let statement of joinController.get()) {

                let result: any = this.checkRelationStatement(statement, innerObj);

                // if the relation is not affected continue
                if (!result) continue;
                // if the relation is affected we want to make a new object
                innerCheck = true;

                let newObj = Object.assign({}, innerObj);
                newObj[statement.objectKey()] = result;
                innerObj = newObj;

            }

            // if any of the relations is effected innerCheck will be true and we push a new object (innerObj)
            if (!innerCheck) {
                array.push(obj);
            } else {
                // if we push a new object which relations has changed we will have to make a new model of it
                check = true;
                let model: any = vault.get(joinController.origin).model;
                array.push(new model(innerObj));
            }
        }

        // if any of the objects has been changed we push the new array
        if (check) {
            this.collector.setChecked();

            return this.orderArray(controller, array);
        }
    }


    /**
     * We first check if the relation of the object is an array or an object.
     */
    private checkRelationStatement(statement: JoinStatement, data: any): any {
        return (statement.returnArray())
            ? this.checkRelationStatementArray(statement, data)
            : this.checkRelationStatementObject(statement, data)
    }

    /**
     * if the relation is a single object.
     * we check if its relation has been altered and if an added object is the same as the relation.
     * if any of this is true we return the new relation object.
     */
    private checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {
        let check: boolean;

        // if the dataObject already has a relation object
        let relation: any = dataObject[statement.objectKey()];

        // first we check if there is an existing object and if it has any relation that will be altered
        let nestedResult: any = this.checkRelationData(statement, relation);
        if (nestedResult) {
            check = true;
            relation = nestedResult;
        }

        // we check if any of the added objects is the same as this one, or one that needs to be added
        let collectorResult: any[] = this.findRelations(statement, dataObject);
        if (collectorResult) {
            check = true;

            let keys: string[] = statement.joinStatementController.objectKeys();
            // we just want to copy the relations in case the data is being overwritten.
            let obj: any = this.transferRelations(keys, relation, collectorResult[0]);

            // we do need to return a new model;
            let model: any = vault.get(statement.origin).model;
            relation = new model(obj);
        }

        if (check) return relation;
    }


    /**
     * if the relation is an array
     * first we check if every relation object has to be changed according to the new items (nested relations)
     * then we check if any of the new items needs to be added to this relation
     */
    private checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {

        // the already existing relation objects on the dataObject
        let relations: any[] = dataObject[statement.objectKey()];

        let array: any[] = [];
        let check: boolean = false;

        // first we check if there are any nested relations and if they are adjusted
        for (let relationObj of relations) {

            // checks if there are any relations that need to be adjusted to the object
            // it will return falsy if there is no controller/relations or if no adjustments have been made
            let result = this.checkRelationData(statement, relationObj);

            if (!result) {
                array.push(relationObj)
            } else {
                array.push(result); //result is already a newly made model
                check = true;
            }
        }

        // next we check if any of the collectors data needs to be added to here
        let result = this.findRelations(statement, dataObject);

        // if nothing needs to be added we can return
        if (!result) { //todo doesn't look so pretty
            return (check)
                ? this.orderArray(statement, array)
                : null

        }

        let newObjects: any[] = [];
        let existingObjects: any[] = [];

        let primaryKey: string = vault.get(statement.key).primaryKey;

        // checks if the object is new or already is on the array (overwritten)
        resultLoop: for (let obj of result) {
            for (let relation of array) {
                if (relation[primaryKey] === obj[primaryKey]) {
                    existingObjects.push(obj);
                    continue resultLoop;
                }
            }
            newObjects.push(obj);
        }

        let keys: string[] = vault.get(statement.key).relations.objectKeys();
        let model: any = vault.get(statement.key).model;

        // push all the right objects in the same array for push
        arrayLoop: for (let relation of array) {
            for (let obj of existingObjects) {
                if (obj[primaryKey] === relation[primaryKey]) {

                    let newObj: any = new model(obj);
                    newObjects.push(this.transferRelations(keys, relation, newObj));

                    continue arrayLoop;
                }
            }

            newObjects.push(relation);
        }

        return this.orderArray(statement, newObjects);
    }

    /**
     * we check if the relations key is in the collector, if it is we check if the addCollector has anything for the
     * object provided.
     */
    private findRelations(statement: JoinStatement, dataObj: any): any[] {
        // if the relation doesn't exist in the collector then we can return;
        if (!this.addCollector.has(statement.key)) return;

        // we will ask the collector to get all the relations that need to be attached to this object
        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // all the relation ids
        let ids: number[] = vault.get(statement.origin).relations.use(statement.key).find(dataObj[primaryKey]);

        let results: any[] = this.addCollector.get(statement.key, ids);

        // if no results have been found return
        if (results.length === 0) return;

        // check if the found relations need to be filtered before being returned
        return this.orderArray(statement, results);
    }


    /*************************** helper ***************************
     ******************************************************************/
    private checkKeys(collector: Collector): boolean {
        for (let key of collector.use('add').keys()) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }

    /** the received data is a copy*/
    private filterIds(data: any[]): any[] {
        let primaryKey = vault.get(this.data.key).primaryKey;
        // return data.filter(obj => this.data.ids.includes(obj[primaryKey]));
        return data.filter((obj: any) => {
            for (let id of this.data.ids) {
                if (id === obj[primaryKey]) return true;
            }
            return false;
        });
    }


    private transferRelations(keys: string[], oldObject: any, newObject: any): any {
        for (let key of keys) {
            if (oldObject.hasOwnProperty(key)) {
                newObject[key] = oldObject[key];
            }
        }
        return newObject
    }

    private orderArray(controller: InstanceDataPusherInterface, array: any[]): any[] {
        return (controller.orderByStatementController.has())
            ? controller.orderByStatementController.init(array)
            : array
    }

}