import {vault} from "../../../vault/vault";
import {JoinStatement} from "../../../statements/join-statement";
import {ProcessUnit} from "../../../process/process-unit";
import {InstanceDataPush} from "./instance-data-push";

export class InstanceDataUpdater extends InstanceDataPush{

    protected type: string = 'update';

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
    
    //process the parent data;
    private processTarget(): void {
        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!this.typeCollector.has(key)) return;

        let array: any[] = [];
        let check: boolean;

        let primaryKey: string = vault.get(this.data.key).primaryKey;
        let keys: string[] = vault.get(this.data.key).relations.objectKeys();
        let model: any = vault.get(this.data.key).model;

        for (let obj of this.newData) {
            // checks if the object needs to be updated
            let result: any = this.typeCollector.get(this.data.key, obj[primaryKey]);

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

    /**
     * if the relation is a single object.
     * we check if its relation has been altered and if an updated object is the same as the relation.
     * if any of this is true we return the new relation object.
     */
    protected checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        // if the dataObject has the relation
        let relation: any = dataObject[statement.objectKey()];

        // if this object doesn't have the relation there is no need to update
        if (!relation) return;

        let check: boolean;

        // checks if the relation itself needs to be altered
        let primaryKey: string = vault.get(statement.key).primaryKey;
        let collectorResult: any = this.typeCollector.get(statement.key, relation[primaryKey]);
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
    protected checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {
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
            let collectorResult = this.typeCollector.get(statement.key, relation[primaryKey]);
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

}