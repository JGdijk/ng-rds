import {InstanceData} from "../instance-data";
import {vault} from "../../../vault/vault";
import {ProcessUnit} from "../../../process/process-unit";
import {Collector} from "../../../collector/collector";
import {DetachCollector} from "../../../collector/collectors/detach-collector";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {JoinStatement} from "../../../statements/join-statement";
import {WhereStatementController} from "../../../statements/controllers/where-statement-controller";
import {InstanceDataPusherInterface} from "../instance-data-pusher.interface";

export class InstanceDataDetacher {

    private data: InstanceData;

    private collector: Collector;

    private detachCollector: DetachCollector;

    private newData: any[];

    constructor(instanceData: InstanceData) {
        this.data = instanceData;
    }

    public run(processUnit: ProcessUnit): any {

        //if non of the attached keys matches the instance's return false
        if (!this.checkKeys(processUnit.collector)) return false;

        this.init(processUnit);

        this.processTarget();

        this.processRelations();

        return this.newData;
    }

    /**
     * only processes if there are whereHas or whereNotHas statements
     */
    private processTarget(): void {

        // if the detacher doesn't have the key return
        if (!this.detachCollector.has(this.data.key)) return;

        // if there are no where statements
        if (!this.data.whereStatementController.hasWhereHas() && !this.data.whereStatementController.hasWhereNotHas())
            return;

        // checks if any of the data needs to be removed from the current array
        let whereHasResult: any[] = this.checkWhereHas(this.data.whereStatementController, this.newData);
        if (whereHasResult) {
            this.newData = whereHasResult;
            this.newData = this.orderArray(this.data, whereHasResult);
        }

        // checks if any of the data needs to be added to the current array
        let whereHasNotResult: any[] = this.checkWhereHasNot(
            this.data.whereStatementController,
            this.data.joinStatementController,
            this.newData,
            this.data.ids);
        if (whereHasNotResult) {
            this.newData = whereHasNotResult;
            this.newData = this.orderArray(this.data, whereHasNotResult);
        }
    }


    /**
     * returns true if there is no whereHas statement or if it passes the whereHas check
     * this function removes objects if needed
     */
    private checkWhereHas(controller: WhereStatementController, objectsArray: any[]) : any[] {

        // checks if there is a whereHas
        if (!controller.hasWhereHas()) return;

        let primaryKey: string = controller.key;

        let array: any[] =  objectsArray.filter((obj: any) => {

            // checks if the collector has the specific id, if not then we know it won't be detached
            if (!this.detachCollector.get(this.data.key, obj[primaryKey])) return true;

            // if the whereHas is still truthy even after the detach we can keep the object
            return (controller.checkWhereHas(obj));
        });

        if (array.length === 0) return;
        return array;
    }

    /**
     * does a lot
     * this function adds objects if needed
     */
    private checkWhereHasNot(whereStatement: WhereStatementController,
                             joinStatement: JoinStatementController,
                             objectsArray: any[],
                             filterIds: number[] = null): any[] {

        // checks if there is a whereNotHas
        if (!whereStatement.hasWhereNotHas()) return;

        // get all the relations of the whereNotHas
        let keys: string[] = whereStatement.getWhereNotHasKeys();

        // get all the ids from the collector
        let ids = this.detachCollector.getTargetIds(whereStatement.key, keys);

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
     * if the relation is a single object.
     * we check if its relation has been altered and if an added object is the same as the relation.
     * if any of this is true we return the new relation object.
     */
    private checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        let relation: any = dataObject[statement.objectKey()];

        // if there is no relation check if has to be attached (whereNotHas)
        if (!relation) {
            let result = this.checkAttachSingle(statement, dataObject);
            if (result) return {data: result};
            return;
        }

        // check for detach normal
        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;

        //if the relation needs to be detached we return a null object;
        if(this.detachCollector.check(
                statement.origin,
                dataObject[primaryKeyOrigin],
                statement.key,
                relation[primaryKeyRelation])) return {data: null};

        // check for detach whereHas
        if (this.detachCollector.get(statement.key, relation[primaryKeyRelation])) {
            // check if the statement has where has
            if (statement.whereStatementController && statement.whereStatementController.hasWhereHas()) {
                // if the data doesn't pass anymore remove
                if (!statement.whereStatementController.checkWhereHas(relation)) return {data: null}
            }
        }

        // check for nested result if so return the new object;
        let nestedResult: any = this.checkRelationData(statement, relation);
        if (nestedResult) return {data: nestedResult};
    }


    /**
     * if the relation is an array
     * first we check if every relation object has to be changed according to the new items (nested relations)
     * then we check if any of the new items needs to be added to this relation
     */
    private checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {
        // the relations
        let relations : any[] = dataObject[statement.objectKey()];

        // if there are no existing relations we check if the needed to be added according to whereNotHas
        if (relations.length === 0) {
            let result = this.checkAttachArray(statement, dataObject);
            return (result)
                ? {data: this.orderArray(statement, result)}
                : {data: null}
        }

        let check: boolean;
        let array: any[] = [];

        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;

        // we go over every existing relation and check if it still needs to be included
        for (let relation of relations) {

            //if the relation needs to be detached we won't push it;
            if(this.detachCollector.check(
                    statement.origin,
                    dataObject[primaryKeyOrigin],
                    statement.key,
                    relation[primaryKeyRelation])) {
                check = true;
                continue;
            }


            // check for detach whereHas
            if (this.detachCollector.get(statement.key, relation[primaryKeyRelation])) {
                // check if the statement has where has
                if (statement.whereStatementController && statement.whereStatementController.hasWhereHas()) {
                    // if the data doesn't pass anymore remove
                    if (!statement.whereStatementController.checkWhereHas(relation)) {
                        check = true;
                        continue;
                    }
                }
            }

            // we check if there is an existing object and if it has any relation that will be altered
            let nestedResult: any = this.checkRelationData(statement, relation);
            if (nestedResult) {
                check = true;
                array.push(nestedResult);
            } else {
                array.push(relation)
            }
        }

        // checks if there is a whereHasNot condition because we might want to add some additional objects

        let newObjects: any[] = this.checkAttachArray(statement, dataObject, array);

        if (newObjects) return {data: this.orderArray(statement,newObjects)};
        else if (check) return {data: this.orderArray(statement, array)};
    }


    private checkAttachSingle(statement: JoinStatement, dataObject: any): any {

        // if there is no hasWhereNot has return;
        if (!statement.whereStatementController || !statement.whereStatementController.hasWhereNotHas()) return;

        // if the key is not in de detacher return;
        if (!this.detachCollector.get(statement.key)) return;

        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // gets the relation obj
        let result: any = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKey]);

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

    private checkAttachArray(statement:JoinStatement, dataObject: any, relationArray: any[] = null): any[] {

        // if there is no hasWhereNot has return;
        if (!statement.whereStatementController || !statement.whereStatementController.hasWhereNotHas()) return;

        // if the key is not in de detacher return;
        if (!this.detachCollector.get(statement.key)) return;

        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // checks if there is any change of an update
        let ids: number[] = vault.get(statement.origin).relations.use(statement.key).find(dataObject[primaryKey]);

        // if the object doesn't have any relations return;
        if (!ids || ids.length === 0) return;

        // checks which id's needs to be added
        ids = ids.filter((id: number) => !!(this.detachCollector.get(statement.key, id)));

        // if we want to check against existing data we only filter the ids that are not in the existing data
        if (relationArray) {
            ids = ids.filter((id:number) => {
                for (let relation of relationArray) {
                    if (relation[primaryKey] === id) return false;
                }
                return true;
            })
        }
        if (ids.length === 0) return;

        let newObjects: any[] = [];
        // gets every object;
        for (let id of ids) {
            let newObj: any = vault.get(statement.key).data.find(id);
            newObjects.push(newObj);
        }

        // we sill have to check the relations pass the where conditions. if not return
        newObjects = statement.whereStatementController.filter(newObjects);
        if (newObjects.length === 0) return;


        let newModels: any[] = [];
        let model: any = vault.get(statement.key).model;

        // we still have to make models of them
        for (let obj of newObjects) {
            // if there are nested relations add them, if not just the model
            if (statement.has()) {
                newModels.push(statement.attach(statement.key, new model(obj)));
            } else {
                newModels.push(new model(obj));
            }
        }

        return this.orderArray(statement, newModels);
    }


    private checkKeys(collector: Collector): boolean {
        for (let key of collector.use('detach').keys()) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }

    private init(processUnit: ProcessUnit): void {
        this.collector = processUnit.collector;
        this.detachCollector = processUnit.collector.use('detach');
        this.newData = processUnit.data;
    }

    private orderArray(controller: InstanceDataPusherInterface, array: any[]): any[] {
        return (controller.orderByStatementController.has())
            ? controller.orderByStatementController.init(array)
            : array
    }
}

