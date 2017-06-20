import {InstanceData} from "../instance-data";
import {vault} from "../../../vault/vault";
import {VaultRelation} from "../../../vault/vault-relation";
import {UpdateCollector} from "../../../collector/collectors/update-collector";
import {Collector} from "../../../collector/collector";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {JoinStatement} from "../../../statements/join-statement";
import {ProcessUnit} from "../../../process/process-unit";
import {InstanceDataPusherInterface} from "../instance-data-pusher.interface";

export class InstanceDataUpdater {

    private data: InstanceData;

    private collector: Collector;

    private updateCollector: UpdateCollector;

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

        return this.newData
    }

    private checkKeys(collector: Collector): boolean {
        for (let key of collector.use('update').keys()) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }


    //process the parent data;
    private processTarget(): void {
        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!this.updateCollector.has(key)) return;

        let array: any[] = [];
        let check: boolean;

        let primaryKey: string = vault.get(this.data.key).primaryKey;
        let keys: string[] = vault.get(this.data.key).relations.objectKeys();
        let model: any = vault.get(this.data.key).model;

        for (let obj of this.newData) {
            // checks if the object needs to be updated
            let result: any = this.updateCollector.get(this.data.key, obj[primaryKey]);

            if (!result) {
                array.push(obj);
                continue;
            }

            // if the new updated object doesn't pass the where anymore whe remove it from the array
            if (this.data.whereStatementController.has) {
                if (!this.data.whereStatementController.check(result)) {
                    check = true;
                    continue;
                }
            }

            // we now know we will update a object
            check = true;

            // we still need to transfer the relations and make a model out of the object
            let newObj = this.transferRelations(keys, obj, result);
            array.push(new model(newObj));
        }

        if (check) {
            this.collector.setChecked();
            this.newData = this.orderArray(this.data, array);
        }
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
        let array: any[] = [];
        let check: boolean;

        let joinController: JoinStatementController = controller.joinStatementController;

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
     * if the relation is a single object.
     * we check if its relation has been altered and if an updated object is the same as the relation.
     * if any of this is true we return the new relation object.
     */
    private checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        // if the dataObject has the relation
        let relation: any = dataObject[statement.objectKey()];

        // if this object doesn't have the relation there is no need to update
        if (!relation) return;

        let check: boolean;

        // checks if the relation itself needs to be altered
        let primaryKey: string = vault.get(statement.key).primaryKey;
        let collectorResult: any = this.updateCollector.get(statement.key, relation[primaryKey]);
        if (collectorResult) {

            //checks if it still passes the update, if not we return null object
            if (statement.whereStatementController && statement.whereStatementController.has()) {
                if (!statement.whereStatementController.check(collectorResult)) return {data: null}
            }

            check = true;

            let keys: string[] = statement.joinStatementController.objectKeys();
            // we just want to copy the relations in case the data is being overwritten.
            let obj: any = this.transferRelations(keys, relation, collectorResult);

            // we do need to return a new model;
            let model: any = vault.get(statement.key).model;
            relation = new model(obj);
        }

        //we check if there is an existing relation object and if it has any nested relation that will be altered
        let nestedResult: any = this.checkRelationData(statement, relation);
        if (nestedResult) {
            check = true;
            relation = nestedResult;
        }

        if (check) return {data: relation};
    }

    /**
     * if the relation is an array
     * first we check if every relation object has to be changed according to the updated items (nested relations)
     * then we check if any of the items needs to be updated
     */
    private checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {
        // the relations
        let relations : any[] = dataObject[statement.objectKey()];

        if (relations.length === 0) return;

        let array: any[] = [];
        let check: boolean = false;

        let primaryKey: string = vault.get(statement.key).primaryKey;
        let keys: string[] = vault.get(statement.key).relations.objectKeys();
        let model: any = vault.get(statement.key).model;

        // for every relation we going to check if it's updated or not
        for (let relationObj of relations) {

            let innerCheck: boolean;
            let relation: any = relationObj;

            // checks if the object itself needs to be updated
            let collectorResult = this.updateCollector.get(statement.key, relation[primaryKey]);
            if (collectorResult) {

                // checks if it still passes the where statements
                if (statement.whereStatementController && statement.whereStatementController.has()) {
                    // if it doesn't we continue
                    if (!statement.whereStatementController.check(collectorResult)) {
                        // we still need to make check truthy because now we might need to send back an empty array
                        check = true;
                        continue;
                    }
                }

                innerCheck = true;
                let newObj: any = this.transferRelations(keys, relation, collectorResult);
                relation = new model(newObj);
            }

            // we check if any nested relation is updated
            let result: any = this.checkRelationData(statement, relation);
            if (result) {
                innerCheck = true;
                relation = result;
            }

            if (innerCheck) {
                check = true;
                array.push(relation);
            } else {
                array.push(relationObj);
            }
        }
        if (check) return {data: this.orderArray(statement, array)};
    }


    /*************************** helper ***************************
     ******************************************************************/


    private init(processUnit: ProcessUnit): void {
        this.collector = processUnit.collector;
        this.updateCollector = processUnit.collector.use('update');
        this.newData = processUnit.data;
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