import {InstanceData} from "../instance-data";
import {Collector} from "../../../collector/collector";
import {vault} from "../../../vault/vault";
import {RemoveCollector} from "../../../collector/collectors/remove-collector";
import {ProcessUnit} from "../../../process/process-unit";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {JoinStatement} from "../../../statements/join-statement";
import {InstanceDataPusherInterface} from "../instance-data-pusher.interface";

export class InstanceDataRemover {

    private data: InstanceData;

    private collector: Collector;

    private removeCollector: RemoveCollector;

    private newData: any[];

    constructor(instanceData: InstanceData) {
        this.data = instanceData;
    }

    public run(processUnit: ProcessUnit): any[] {

        //if non of the added keys matches the instance's return false
        if (!this.checkKeys(processUnit)) return;

        //set the collector
        this.init(processUnit);

        //checks if any of the main data needs to be added directly
        this.processTarget();

        //checks if any data changes according to any relation connected to this instance;
        this.processRelations();

        return this.newData;
    }

    private processTarget(): void {
        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!this.removeCollector.has(key)) return;

        let data = this.removeCollector.copy(key);

        // check if it matches any id's
        if (this.data.hasIds()) {
            data = this.filterIds(data);
        }

        let primaryKey = vault.get(key).primaryKey;

        let array: any[] = this.newData.filter(obj => {
            for (let dataObj of data) {
                if (dataObj[primaryKey] === obj[primaryKey]) {
                    return true;
                }
            }
            this.collector.setChecked();
            return false;
        });

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
        if(!dataObject) return;

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
    private checkRelationDataArray(controller: InstanceDataPusherInterface, dataArray: any[]): any {

        let joinController: JoinStatementController = controller.joinStatementController;

        let array: any[] = [];
        let check: boolean;

        //goes over every object
        for (let obj of dataArray) {

            let innerCheck: boolean = false;
            // we transfer this to a new object so that we will always be working with the adjust object
            let innerObj: any = obj;

            // goes over every statement
            for (let statement of joinController.get()) {

                let result: any = this.checkRelationStatement(statement, innerObj);
                // if no changes have been made continue
                if (!result) continue;

                innerCheck = true;

                let newObj = Object.assign({}, innerObj);
                newObj[statement.objectKey()] = result.data;
                innerObj = newObj;
            }

            // if any of the relations is effected innerCheck will be true and we push a new object (innerObj)
            if (!innerCheck) {
                array.push(obj);
            } else {
                // if we push a new object which relations have changed we will have to make a new model of it
                check = true;
                let model: any = vault.get(joinController.origin).model;
                array.push(new model(innerObj));
            }
        }

        // if any of the objects have been changed we push the new array
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
     * if the relation needs to be deleted we return null (in an object because null means no changes)
     * if any of the nested relation has changed we return a new object
     */
    private checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        let relation: any = dataObject[statement.objectKey()];

        if (!relation) return {data: null};

        let primaryKey: string = vault.get(statement.key).primaryKey;

        //checks if the relation object needs to be deleted
        if (this.removeCollector.check(statement.key, relation[primaryKey])) return {data: null}; //todo not nice

        // will delete any nested object if needed
        let result: any = this.checkRelationData(statement, relation);

        if (result) return {data: result}; //todo not nice
    }

    /**
     * will make a new array and returns it if any of the relation (or nested) data is deleted
     */
    private checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {

        let check: boolean;
        let array: any[] = [];
        let primaryKey: string = vault.get(statement.key).primaryKey;

        //checks every relation
        for (let relation of dataObject[statement.objectKey()]) {

            //if the relation needs to be removed, simply don't push it to the new array
            if (this.removeCollector.check(statement.key, relation[primaryKey])) {
                check = true;
                continue;
            }

            //checks if any of the nested relation needs to be deleted
            let result = this.checkRelationData(statement, dataObject[statement.objectKey()]);

            // if any of the nested relations was deleted push the new relations, else push the old
            if (result) {
                check = true;
                array.push(result)
            } else {
                array.push(relation);
            }
        }

        //if any of the data has been altered, return the newly made array
        if (check) return {data: this.orderArray(statement, array)};
    }


    /*************************** Helper function ***************************
     ******************************************************************/

    private checkKeys(processUnit: ProcessUnit): boolean {
        for (let key of processUnit.collector.use('remove').keys()) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }


    private filterIds(data: any[]): any[] {
        return data.filter(id => () => {
            if (this.data.ids === id) return true;
        });
    }

    private init(processUnit: ProcessUnit): void {
        this.collector = processUnit.collector;
        this.removeCollector = processUnit.collector.use('remove');
        this.newData = processUnit.data;
    }

    private orderArray(controller: InstanceDataPusherInterface, array: any[]): any[] {
        return (controller.orderByStatementController.has())
            ? controller.orderByStatementController.init(array)
            : array
    }
}