import {InstanceData} from "../instance-data";
import {Collector} from "../../../collector/collector";
import {vault} from "../../../vault/vault";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {ProcessUnit} from "../../../process/process-unit";
import {AttachCollector} from "../../../collector/collectors/attach-collector";
import {JoinStatement} from "../../../statements/join-statement";
import {WhereStatementController} from "../../../statements/controllers/where-statement-controller";
import {InstanceDataPusherInterface} from "../instance-data-pusher.interface";

export class InstanceDataAttacher {

    private data: InstanceData;

    private collector: Collector;

    private attachCollector: AttachCollector;

    private newData: any[];

    constructor(instanceData: InstanceData) {
        this.data = instanceData;
    }

    public run(processUnit: ProcessUnit): any[] {

        //if non of the attached keys matches the instance's return false
        if (!this.checkKeys(processUnit.collector)) return;

        this.init(processUnit);

        // we process the relations first
        this.processRelations();

        this.processTarget();

        return this.newData;
    }

    /**
     * this function only checks if there is a whereHas statement that needs to be checked
     */
    private processTarget(): void {

        // if the attacher doesn't have the key return
        if (!this.attachCollector.has(this.data.key)) return;

        // if there are no where statements
        if (!this.data.whereStatementController.hasWhereHas() && !this.data.whereStatementController.hasWhereNotHas())
            return;

        // checks if any of the data needs to be removed from the current array
        let whereHasNotResult: any[] = this.checkWhereHasNot(this.data.whereStatementController, this.newData);
        if (whereHasNotResult) {
            this.newData = this.orderArray(this.data, whereHasNotResult);
            this.collector.setChecked();
        }

        // checks if any of the data needs to be added to the current array
        let whereHasResult: any[] = this.checkWhereHas(
            this.data.whereStatementController,
            this.data.joinStatementController,
            this.newData,
            this.data.ids);
        if (whereHasResult) {
            this.newData = this.orderArray(this.data, whereHasResult);
            this.collector.setChecked();
        }
    }

    /**
     * checks if any of the data needs to be removed
     */
    private checkWhereHasNot(controller: WhereStatementController, objectsArray: any[]): any[] {
        // checks if there is a whereNotHas
        if (!controller.hasWhereNotHas()) return;

        let primaryKey: string = controller.key;

        let array: any[] = objectsArray.filter((obj: any) => {

            // checks if the collector has the specific id, if not then we know it won't be detached
            if (!this.attachCollector.get(this.data.key, obj[primaryKey])) return true;

            // if the whereNotHas is still truthy even after the detach we can keep the object
            return (controller.checkWhereNotHas(obj));
        });

        if(array.length === 0) return;
        return array;
    }

    /**
     * checks if any data needs to be added
     */
    private checkWhereHas(whereStatement: WhereStatementController,
                          joinStatement: JoinStatementController,
                          objectsArray: any[],
                          filterIds: number[] = null): any[] {

        // checks if there is a whereHas
        if (!whereStatement.hasWhereHas()) return;


        // get all the relations of the whereHas
        let keys: string[] = whereStatement.getWhereHasKeys();

        // get all the ids from the collector
        let ids = this.attachCollector.getTargetIds(whereStatement.key, keys);

        // checks if there are any targeted ids
        if (filterIds) ids = ids.filter((id: number) => {
            for (let filterId of filterIds) {
                if (id === filterId) return true;
            }
            return false;
        });

        let primaryKey: string = vault.get(whereStatement.key).primaryKey;

        // checks if the object is already in the array
        ids = ids.filter((id: number) => {
            for (let obj of objectsArray) {
                if (obj[primaryKey] === id) return false;
            }
            return true;
        });

        // get all the objects from the vault
        let newObjects: any[] = vault.get(whereStatement.key).data.get(ids);

        // filter them against all the where statements;
        newObjects = whereStatement.filter(newObjects);

        // if by now we don't have any result we return
        if (newObjects.length === 0) return;

        let array: any[] = [];

        // push the object that are already in
        for (let obj of objectsArray) {
            array.push(obj);
        }

        let model: any = vault.get(whereStatement.key).model;
        // make models and push the new objects
        for (let obj of newObjects) {
            let newObj: any = new model(obj);

            // if it has any relations attach it
            if (joinStatement && joinStatement.has()) newObj = joinStatement.attach(newObj);

            array.push(newObj);
        }

        return array;
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
        if (!controller) return;

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
            newObj[statement.objectKey()] = result.data;
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
        for (let obj of dataArray ) {

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
                newObj[statement.objectKey()] = result.data;
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
     * checks if the relation needs to be added/deleted or changed according to the data
     */
    private checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        let relation: any = dataObject[statement.objectKey()];

        // if there is a relation
        if (relation) {

            //checks if it needs to be detached (whereHasNot)
            if (this.checkDetachSingle(statement, relation)) return {data: null};

            //checks if any nested adjustments have to be made
            let result = this.checkRelationData(statement, relation);
            if (result) return {data: result};
            return;
        }

        // checks if it needs to be attached (normally)
        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;

        // checks if the key of the objects exists in the attached items
        if (this.attachCollector.get(statement.origin, dataObject[primaryKeyOrigin], statement.key)) {
            let obj: any = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKeyOrigin]);
            if (obj) {
                // checks if there are where statements and if it passes
                if (!statement.whereStatementController
                    || !statement.whereStatementController.has()
                    || statement.whereStatementController.check(obj)
                ) {
                    let model: any = vault.get(statement.key).model;
                    return {data: statement.attach(statement.origin, new model(obj))}
                }
            }
        }

        // checks if it needs to be attached (because of whereHas)
        let result = this.checkAttachSingle(statement, dataObject);
        if (result) return {data: result};

    }

    /**
     * checks if the relation has to be adjusted and returns a new array if so
     */
    private checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {

        // the relations
        let relations : any[] = dataObject[statement.objectKey()];

        let array: any[] = [];
        let check: boolean;

        // we check every object if the relations have been changed, push according to the result
        for (let obj of relations) {
            let resultNested: any = this.checkRelationData(statement, obj);
            if (resultNested) {
                check = true;
                array.push(resultNested);
            } else {
                array.push(obj);
            }
        }

        // we check if we need to detach something according to whereHasNot
        let result: any[] = this.checkDetachArray(statement, array);
        if (result) {
            array = result;
            check = true;
        }

        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;

        // if the key is in the attacher we attach normally
        let attacherResult = this.attachCollector.get(statement.origin, dataObject[primaryKeyOrigin], statement.key);
        if (attacherResult) {

            // checks if the attached item is already in the array
            let ids: number[] = attacherResult.filter((id: number) => {
                for (let obj of array) {
                    if (obj[primaryKeyRelation] === id) return false;
                }
                return true;
            });

            // get all the objects
            let newCollectorObjects = vault.get(statement.key).data.get(ids);
            // checks the objects against the where statements
            if (statement.whereStatementController && statement.whereStatementController.has()) {
                newCollectorObjects = statement.whereStatementController.filter(newCollectorObjects);
            }

            // if there are still objects
            if (newCollectorObjects.length > 0) {
                check = true;

                let model: any = vault.get(statement.key).model;

                for (let obj of newCollectorObjects) {
                    array.push(statement.attach(statement.origin, new model(obj)))
                }
            }
        }

        // check if any of the relations has changed based on a whereHas statement
        let checkWhereHasAttachResult: any[] = this.checkAttachArray(statement, dataObject, array);
        if (checkWhereHasAttachResult) {
            check = true;
            array = checkWhereHasAttachResult;
        }

        if (check) return {data: this.orderArray(statement, array)};
    }

    /**
     * checks if the existing object needs to be removed according to the whereHasNot statement
     */
    private checkDetachSingle(statement: JoinStatement, relation: any): any {
        // checks the whereHasNot
        if (!statement.whereStatementController || statement.whereStatementController.hasWhereNotHas()) return;

        return !statement.whereStatementController.checkWhereNotHas(relation);
    }

    /**
     * checks if the array contains any data that needs to be removed according to the whereHasNot
     */
    private checkDetachArray(statement: JoinStatement, relations: any[]): any[] {
        if (relations.length === 0) return;

        if (!statement.whereStatementController || !statement.whereStatementController.hasWhereNotHas()) return;

        let array: any[] = [];
        let check: boolean;

        for (let relation of relations) {
            if (!statement.whereStatementController.checkWhereNotHas(relation)) {
                check = true;
                continue;
            }
            array.push(relation);
        }

        if (check) return array;
    }

    /**
     * adds an object based on whereHas statement
     */
    private checkAttachSingle(statement: JoinStatement, dataObject: any): any {

        // if there is no hasWhereNot has return;
        if (!statement.whereStatementController || !statement.whereStatementController.hasWhereHas()) return;

        // if the key is not in de attacher return;
        if (!this.attachCollector.get(statement.key)) return;

        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // gets the relation obj
        let result: any = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKey]).data;

        // if there is simply no relation return;
        if (!result) return;
        // if the relation still doesn't passes the check return
        if (!statement.whereStatementController.check(result)) return;
        // makes a model of it + get nested relations;
        let model: any = vault.get(statement.key).model;

        return (statement.has())
            ? statement.joinStatementController.attach(new model(result))
            : new model(result)
    }

    /**
     * adds extra items based on whereHas statement
     */
    private checkAttachArray(statement: JoinStatement, dataObject: any, relationArray: any[]): any[] {

        // if no whereHas return
        if (!statement.whereStatementController || !statement.whereStatementController.hasWhereHas()) return;

        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;

        // the ids of all the relations
        let ids = vault.get(statement.origin).relations.use(statement.key).find(dataObject[primaryKeyOrigin]);

        // checks them against the relation objects that are already there
        if (relationArray.length > 0) {
            ids = ids.filter((id: number) => {
                for (let obj of relationArray) {
                    if (obj[primaryKeyRelation] === id) return false;
                }
                return true;
            })
        }

        // get all the objects
        let newObjects = vault.get(statement.key).data.get(ids);

        //check them against the where statements (both whereHas and where)
        if (statement.whereStatementController && statement.whereStatementController.has) {
            newObjects = statement.whereStatementController.filter(newObjects);
        }

        // if no objects are left return;
        if (newObjects.length === 0) return;

        let array: any[] = [];

        //first we push the existing objects
        for (let obj of relationArray) {
            array.push(obj);
        }

        // attach the new items
        let model: any = vault.get(statement.key).model;
        for (let obj of newObjects) {

            // if there are nested relations add them, if not just the model
            if (statement.has()) {
                array.push(statement.attach(statement.key, new model(obj)));
            } else {
                array.push(new model(obj));
            }

        }
        return (this.orderArray(statement, array));
    }

    /*************************** helpers ***************************
     ******************************************************************/

    private checkKeys(collector: Collector): boolean {
        for (let key of collector.use('attach').keys()) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }

    private init(processUnit: ProcessUnit): void {
        this.collector = processUnit.collector;
        this.attachCollector = processUnit.collector.use('attach');
        this.newData = processUnit.data;
    }

    private orderArray(controller: InstanceDataPusherInterface, array: any[]): any[] {
        return (controller.orderByStatementController.has())
            ? controller.orderByStatementController.init(array)
            : array
    }


}