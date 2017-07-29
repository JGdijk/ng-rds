import {vault} from "../../../vault/vault";
import {ProcessUnit} from "../../../process/process-unit";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {JoinStatement} from "../../../statements/join-statement";
import {WhereStatementController} from "../../../statements/controllers/where-statement-controller";
import {InstanceDataPush} from "./instance-data-push";
import {whereNotHasCheck} from "./where-has-checks/where-has-not-checker";
import {modelStamps} from "../../../model/model-stamps";

export class InstanceDataDetacher extends InstanceDataPush {

    protected type: string = 'detach';

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

        // if there are no where statements
        if (!this.data.whereStatementController.hasWhereHas() && !this.data.whereStatementController.hasWhereNotHas())
            return;

        // checks if any of the data needs to be removed from the current array
        let whereHasResult: any[] = this.checkWhereHas(this.data.whereStatementController, this.newData);
        if (whereHasResult) {
            this.newData = this.orderArray(this.data, whereHasResult);
            this.collector.setChecked();
        }

        // checks if any of the data needs to be added to the current array
        let whereHasNotResult: any[] = this.checkWhereHasNot(
            this.data.whereStatementController,
            this.data.joinStatementController,
            this.newData,
            this.data.ids);
        if (whereHasNotResult) {
            this.newData = this.orderArray(this.data, whereHasNotResult);
            this.collector.setChecked();
        }
    }


    /**
     * returns true if there is no whereHas statement or if it passes the whereHas check
     * this function removes objects if needed
     */
    private checkWhereHas(controller: WhereStatementController, objectsArray: any[]): any[] {

        // checks if there is a whereHas
        if (!controller.hasWhereHas()) return;

        let check: boolean = false;

        let array: any[] = objectsArray.filter((obj: any) => {
            if (controller.check(obj)) return true;
            check = true;
            return false;
        });

        return (check)
            ? array
            : null;
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
        if (!whereStatement.hasWhereNotHas() && !whereStatement.hasWhereHas()) return;

        // get all the ids from the collector
        let ids = whereNotHasCheck.run(this.typeCollector, whereStatement);

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
            let newObj: any = modelStamps.added(new model(obj), this.collector.timeStamp);

            // if it has any relations attach it
            if (joinStatement && joinStatement.has()) {
                array.push(joinStatement.attach(newObj))
            } else {
                array.push(newObj);
            }

        }

        return array;
    }


    /**
     * if the relation is a single object.
     * we check if its relation has been altered and if an added object is the same as the relation.
     * if any of this is true we return the new relation object.
     */
    protected checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        let relation: any = dataObject[statement.objectKey()];

        // if there is no relation check if has to be attached (whereNotHas)
        if (!relation) {
            let result = this.checkAttachSingle(statement, dataObject);
            if (result) return {data: result};
            return;
        }

        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;

        // check for normal detach
        if (!this.typeCollector.check(
                statement.origin,
                dataObject[primaryKeyOrigin],
                statement.key,
                relation[primaryKeyRelation]
        )) {
            return {data: null}
        }

        // check for detach on whereHas
            if (statement.whereStatementController && statement.whereStatementController.hasWhereHas()) {
                if (!statement.whereStatementController.check(relation)) {
                    return {data: null}
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
    protected checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {
        // the relations
        let relations: any[] = dataObject[statement.objectKey()];

        // if there are no existing relations we check if the needed to be added according to whereNotHas
        if (relations.length === 0) {
            let result = this.checkAttachArray(statement, dataObject);
            return (result)
                ? {data: this.orderArray(statement, result)}
                : null
        }

        let check: boolean;
        let array: any[] = [];

        // we check if any of the existing data needs to be altered
        for (let relation of relations) {

            let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
            let primaryKeyRelation: string = vault.get(statement.key).primaryKey;

            // check for normal detach
            if (this.typeCollector.check(
                    statement.origin,
                    dataObject[primaryKeyOrigin],
                    statement.key,
                    relation[primaryKeyRelation]
                )) {
                check = true;
                continue;
            }

            // check if it still passes the where check;
            if (!statement.whereStatementController.check(relation)) {
                check = true;
                continue;
            }

            // checks if the object needs to be altered because of nested relations
            let nestedResult: any = this.checkRelationData(statement, relation);
            if (nestedResult) {
                array.push(nestedResult)
            } else {
                array.push(relation);
            }
        }

        // check if any data needs to be added (whereNotHas)
        let newObjects: any[] = this.checkAttachArray(statement, dataObject, array);
        if (newObjects) {
            check = true;
            for (let obj of newObjects) {
                array.push(obj);
            }
        }

        if (check) return {data: this.orderArray(statement, array)};
    }


    private checkAttachSingle(statement: JoinStatement, dataObject: any): any {

        // if there is no hasWhereNot has return;
        if (!statement.whereStatementController || (
                !statement.whereStatementController.hasWhereNotHas() && !statement.whereStatementController.hasWhereHas()
            )) return;

        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // gets the relation obj
        let result: any = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKey]);

        // if there is simply no relation return;
        if (!result) return;

        // if the relation still doesn't passes the check return
        if (!statement.whereStatementController.check(result)) return;

        // makes a model of it + get nested relations;
        let model: any = vault.get(statement.key).model;
        let newModel = modelStamps.added(new model(result), this.collector.timeStamp);
        return (statement.has())
            ? statement.joinStatementController.attach(newModel)
            : newModel
    }

    private checkAttachArray(statement: JoinStatement, dataObject: any, relationArray: any[] = null): any[] {

        // if there is no hasWhereNot has return;
        if (!statement.whereStatementController || (
                !statement.whereStatementController.hasWhereNotHas() && !statement.whereStatementController.hasWhereHas()
            )
        ) return;

        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // get all the ids of the relation
        let ids: number[] = vault.get(statement.origin).relations.use(statement.key).find(dataObject[primaryKey]);

        // if the object doesn't have any relations return;
        if (!ids || ids.length === 0) return;

        // if we want to check against existing data we only filter the ids that are not in the existing data
        if (relationArray) {
            ids = ids.filter((id: number) => {
                for (let relation of relationArray) {
                    if (relation[primaryKey] === id) return false;
                }
                return true;
            })
        }
        if (ids.length === 0) return;

        // get all the objects
        let newObjects: any[] = vault.get(statement.key).data.get(ids);

        // we sill have to check the relations pass the where conditions.
        newObjects = statement.whereStatementController.filter(newObjects);

        // if no results are left nothing needs to be attached
        if (newObjects.length === 0) return;

        let newModels: any[] = [];
        let model: any = vault.get(statement.key).model;

        // we still have to make models of them
        for (let obj of newObjects) {
            let newModel = modelStamps.added(new model(obj), this.collector.timeStamp);
            // if there are nested relations add them, if not just the model
            if (statement.has()) {
                newModels.push(statement.attach(statement.key, newModel));
            } else {
                newModels.push(newModel);
            }
        }

        return this.orderArray(statement, newModels);
    }
}

