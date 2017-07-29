import {vault} from "../../../vault/vault";
import {JoinStatement} from "../../../statements/join-statement";
import {ProcessUnit} from "../../../process/process-unit";
import {InstanceDataPush} from "./instance-data-push";
import {modelStamps} from "../../../model/model-stamps";

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

        // we go over every new object to check if it needs to be put in.
        // then we go over every item that already exists to see if it needs to be replaced
        // + we check if every items still checks the test.

        let key: string = this.data.key;


        // we filter out the new data
        let updatedData: any[] = this.typeCollector.get(key);

        if (updatedData) {
            updatedData = this.data.whereStatementController.filter(updatedData);
        }


        // we make a new array to return + set a check boolean if we need to return
        let array: any[] = [];
        let check: boolean;


        let primaryKey: string = vault.get(this.data.key).primaryKey;
        let keys: string[] = vault.get(this.data.key).relations.objectKeys();
        let model: any = vault.get(this.data.key).model;

        outerLoop: for (let obj of this.newData) {

            if (this.data.whereStatementController.has()) {
                if (!this.data.whereStatementController.check(obj)) {
                    check = true;
                    continue;
                }
            }

            // checks if the object needs to be updated
            if (updatedData) {
                for (let i in updatedData) {
                    let newObj: any = updatedData[i];

                    if (newObj[primaryKey] !== obj[primaryKey]) continue;

                    // we have found a match
                    check = true;

                    // if it passes we add it to the array
                    newObj = this.transferRelations(keys, obj, newObj);

                    let newModel = new model(newObj);
                    modelStamps.updated(newModel, this.collector.timeStamp);

                    array.push(newModel);

                    let key: any = i;
                    updatedData.splice(key, 1);
                    continue outerLoop;
                }
            }


            array.push(obj);
        }

        // new data that wasn't in the array before but that now passes the where check
        if (updatedData && updatedData.length > 0) {
            check = true;

            for (let newObj of updatedData) {
                let newModel = modelStamps.added(new model(newObj), this.collector.timeStamp);

                if (this.data.joinStatementController.has()) {
                    array.push(this.data.joinStatementController.attach(newModel))
                } else {
                    array.push(newModel)
                }
            }
        }

        // if there is a whereHas, things will be more complicated and all needs to be checked
        // todo optimize
        if (this.data.whereStatementController.hasWhereHas() || this.data.whereStatementController.hasWhereNotHas()) {
            let objects: any[] = vault.get(this.data.key).data.get();
            objects = this.data.whereStatementController.filter(objects);

            if (objects.length > 0 ) {
                objectsLoop: for (let obj of objects) {
                    for (let arrayObj of array) {
                        if (arrayObj[primaryKey] === obj[primaryKey]) continue objectsLoop
                    }

                    check = true;
                    let newModel = modelStamps.added(new model(obj), this.collector.timeStamp);

                    if (this.data.joinStatementController.has()) {
                        array.push(this.data.joinStatementController.attach(newModel))
                    } else {
                        array.push(newModel)
                    }

                }
            }
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

        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let model: any = vault.get(statement.key).model;

        //if no relations is presented
        if (!relation) {
             relation = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKeyOrigin]).data;

            // check if there is a relation
            if (!relation) return;

            // check if it passes the check (if so add)
            if (!statement.whereStatementController.check(relation)) return;

            let newModel = modelStamps.added(new model(relation), this.collector.timeStamp);

            if (!statement.joinStatementController.has()) {
                return newModel;
            } else {
                return statement.joinStatementController.attach(newModel);
            }
        }


        //if relation is presented

        // checks if the relation still passes the where check
        if (!statement.whereStatementController.check(relation)) {
            return {data: null}
        }

        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;
        let check: boolean;

        // checks if the relation itself needs to be altered
        let collectorResult: any = this.typeCollector.get(statement.key, relation[primaryKeyRelation]);
        if (collectorResult) {
            check = true;

            let keys: string[] = statement.joinStatementController.objectKeys();
            // we just want to copy the relations in case the data is being overwritten.
            let obj: any = this.transferRelations(keys, relation, collectorResult);

            // we do need to return a new model;
            let model: any = vault.get(statement.key).model;
            relation = modelStamps.updated(new model(obj), this.collector.timeStamp);
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

        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let model: any = vault.get(statement.key).model;

        //if no relations
        if (relations.length === 0) {

            // we have to check if there is a whereStatement
            if (!statement.whereStatementController.has()) return;

            // grab relations + filter them
            relations = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKeyOrigin]).data;
            relations = statement.whereStatementController.filter(relations);

            if (relations.length === 0) return;

            let returnArray: any[] = [];

            for (let relation of relations) {

                let newModel = modelStamps.added(new model(relation), this.collector.timeStamp);

                if (!statement.joinStatementController.has()) {
                    returnArray.push(newModel);
                } else {
                    returnArray.push(statement.joinStatementController.attach(newModel));
                }
            }

            return {data: returnArray};
        }

        // if relation
        let array: any[] = [];
        let check: boolean = false;

        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;
        let keys: string[] = vault.get(statement.key).relations.objectKeys();

        // for every relation we going to check if it's updated or not
        for (let relationObj of relations) {

            if (statement.whereStatementController.has()) {
                if (!statement.whereStatementController.check(relationObj)) {
                    check = true;
                    continue;
                }
            }

            let innerCheck: boolean;
            let relation: any = relationObj;

            // checks if the object itself needs to be updated
            let collectorResult = this.typeCollector.get(statement.key, relation[primaryKeyRelation]);
            if (collectorResult) {
                innerCheck = true;
                let newObj: any = this.transferRelations(keys, relation, collectorResult);
                relation = modelStamps.updated(new model(newObj), this.collector.timeStamp);
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

        // we need to check if there is new data that should be included after the update
        if (statement.whereStatementController.has()) {
            let newRelations: any[] = vault
                .get(statement.origin)
                .getRelations(statement.key, dataObject[primaryKeyOrigin]).data;
            newRelations = statement.whereStatementController.filter(newRelations);

            if (newRelations.length > 0) {
                newRelationLoop: for (let newRelation of newRelations) {
                    for (let obj of array) {
                        if (newRelation[primaryKeyRelation] !== obj[primaryKeyRelation]) continue;

                        check = true;

                        let newModel = modelStamps.added(new model(newRelation), this.collector.timeStamp);

                        if (!statement.joinStatementController.has()) {
                            array.push(newModel)
                        } else {
                            array.push(statement.joinStatementController.attach(newModel))
                        }

                        continue newRelationLoop;
                    }
                }
            }
        }

        if (check) return {data: this.orderArray(statement, array)};
    }

}