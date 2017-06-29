import {vault} from "../../../vault/vault";
import {JoinStatement} from "../../../statements/join-statement";
import {ProcessUnit} from "../../../process/process-unit";
import {InstanceDataPush} from "./instance-data-push";

export class InstanceDataAdder extends InstanceDataPush {

    protected type: string = 'add';

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

    private processTarget(): void {

        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!this.typeCollector.has(key)) return;

        let data = this.typeCollector.copy(key);

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
            if (this.data.primaryOnly) {
                newData.push(new model(obj));
            } else {
                newData.push(this.data.joinStatementController.attach(new model(obj)));
            }
        }

        let array: any[] = [];

        // first we check of every exiting object if it can be pushed or replaced by a new object
        existingLoop: for (let currentObj of this.newData) {
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

        // finally we add the final objects
        for (let obj of newData) {
            array.push(obj);
        }

        this.newData = this.orderArray(this.data, array);
    }

    /**
     * if the relation is a single object.
     * we check if its relation has been altered and if an added object is the same as the relation.
     * if any of this is true we return the new relation object.
     */
    protected checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {
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

        if (check) return {data: relation};
    }


    /**
     * if the relation is an array
     * first we check if every relation object has to be changed according to the new items (nested relations)
     * then we check if any of the new items needs to be added to this relation
     */
    protected checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {

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
                ? {data: this.orderArray(statement, array)}
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

        return {data: this.orderArray(statement, newObjects)};
    }

    /**
     * we check if the relations key is in the collector, if it is we check if the typeCollector has anything for the
     * object provided.
     */
    private findRelations(statement: JoinStatement, dataObj: any): any[] {
        // if the relation doesn't exist in the collector then we can return;
        if (!this.typeCollector.has(statement.key)) return;

        // we will ask the collector to get all the relations that need to be attached to this object
        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // all the relation ids
        let ids: number[] = vault.get(statement.origin).relations.use(statement.key).find(dataObj[primaryKey]);

        let results: any[] = this.typeCollector.get(statement.key, ids);

        // if no results have been found return
        if (results.length === 0) return;

        // check if the found relations need to be filtered before being returned
        return this.orderArray(statement, results);
    }


    /*************************** helper ***************************
     ******************************************************************/

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

}