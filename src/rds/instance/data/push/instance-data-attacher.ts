import {vault} from "../../../vault/vault";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {ProcessUnit} from "../../../process/process-unit";
import {JoinStatement} from "../../../statements/join-statement";
import {WhereStatementController} from "../../../statements/controllers/where-statement-controller";
import {InstanceDataPush} from "./instance-data-push";
import {whereHasCheck} from "./where-has-checks/where-has-checker";
import {modelStamps} from "../../../model/model-stamps";

export class InstanceDataAttacher extends InstanceDataPush{

    protected type: string = 'attach';

    public run(processUnit: ProcessUnit): any[] {

        if (!this.checkKeys(processUnit.collector)) return;

        this.init(processUnit);

        this.processRelations();

        this.processTarget();

        return this.newData;
    }

    /**
     * this function only checks if there is a whereHas statement that needs to be checked
     */
    private processTarget(): void {

        // if there are no where statements
        if (!this.data.whereStatementController.hasWhereHas() && !this.data.whereStatementController.hasWhereNotHas())
            return;

        // checks if any of the data needs to be removed from the current array
        let whereHasNotResult: any[] =
            this.checkWhereHasNot(this.data.whereStatementController, this.newData);
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
        // checks if there is a whereNotHas or whereHas (for nested)
        if (!controller.hasWhereNotHas() && !controller.hasWhereHas()) return;

        let check: boolean = false;

        let array: any[] = objectsArray.filter((obj: any) => {
            if (controller.check(obj)) return true;
            modelStamps.removed(obj);
            check = true;
            return false;
        });

        return (check)
            ? array
            : null;

        //todo optimize?

        // let ids: number[] = whereNotHasCheck.run(this.typeCollector, controller);
        //
        // // checks if there are any targeted ids
        // if (filterIds) ids = ids.filter((id: number) => {
        //     for (let filterId of filterIds) {
        //         if (id === filterId) return true;
        //     }
        //     return false;
        // });
        //
        // // get all the objects from the vault
        // let objects: any[] = vault.get(controller.key).data.get(ids);
        //
        // // checks every object if it needs to be deleted or not, we only want the items that don't pass the check
        // // anymore
        // objects = objects.filter((obj: any) => !controller.check(obj));
        //
        // // now we want to reduce the array to only ids
        // let primaryKey: string = controller.key;
        //
        // let detachIds: number[] = objects.map((o: any) => o[primaryKey]);
        //
        // // now we can check if any of the data needs to be deleted from the array;
        // let check: boolean;
        // let array: any[] = objectsArray.filter((obj: any) => {
        //     for (let id of detachIds) {
        //         if (obj[primaryKey] === id ) {
        //             check = true;
        //             return false;
        //         }
        //     }
        //     return true;
        // });
        //
        // if (check) return array;
    }

    /**
     * checks if any data needs to be added
     */
    private checkWhereHas(whereStatementController: WhereStatementController,
                          joinStatement: JoinStatementController,
                          objectsArray: any[],
                          filterIds: number[] = null): any[] {

        // checks if there is a whereHas
        if (!whereStatementController.hasWhereHas()) return;

        // get all the ids that might have been affected
        let ids = whereHasCheck.run(this.typeCollector, whereStatementController);

        // checks if there are any targeted ids
        if (filterIds) ids = ids.filter((id: number) => {
            for (let filterId of filterIds) {
                if (id === filterId) return true;
            }
            return false;
        });

        let primaryKey: string = vault.get(whereStatementController.key).primaryKey;

        // checks if the object is already in the array
        ids = ids.filter((id: number) => {
            for (let obj of objectsArray) {
                if (obj[primaryKey] === id) return false;
            }
            return true;
        });

        // get all the objects from the vault
        let newObjects: any[] = vault.get(whereStatementController.key).data.get(ids);

        // filter them against all the where statements;
        newObjects = whereStatementController.filter(newObjects);

        // if by now we don't have any result we return
        if (newObjects.length === 0) return;

        let array: any[] = [];

        // push the object that are already in
        for (let obj of objectsArray) {
            array.push(obj);
        }

        let model: any = vault.get(whereStatementController.key).model;
        // make models and push the new objects
        for (let obj of newObjects) {
            let newObj: any = new model(obj);

            // if it has any relations attach it
            if (joinStatement && joinStatement.has() && !this.data.primaryOnly) newObj = joinStatement.attach(newObj);

            modelStamps.added(newObj, this.collector.timeStamp);

            array.push(newObj);
        }

        return array;
    }



    /**
     * checks if the relation needs to be added/deleted or changed according to the data
     */
    protected checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        let relation: any = dataObject[statement.objectKey()];

        // if there is a relation
        if (relation) {

            //checks if it needs to be detached (whereHasNot)
            if (this.checkDetachSingle(statement, relation)){
                modelStamps.removed(relation);
                return {data: null}
            }

            //checks if any nested adjustments have to be made
            let result = this.checkRelationData(statement, relation);
            if (result) return {data: result};
            return;
        }

        // checks if it needs to be attached (normally)
        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;

        // checks if the key of the objects exists in the attached items
        if (this.typeCollector.get(statement.origin, dataObject[primaryKeyOrigin], statement.key)) {
            let obj: any = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKeyOrigin]);
            if (obj) {
                // checks if there are where statements and if it passes
                if (!statement.whereStatementController
                    || !statement.whereStatementController.has()
                    || statement.whereStatementController.check(obj)
                ) {
                    let model: any = vault.get(statement.key).model;
                    let newModel = modelStamps.added(new model(obj), this.collector.timeStamp);

                    // here it returns if something needs to be added
                    return {data: statement.attach(statement.origin, newModel)}
                }
            }
        }

        // checks if it needs to be attached (because of whereHas)
        // this checks for whereHas, if there is no whereHas this will be skipped.
        // the other code doesn't pick up a deeply nested wherehas relation
        let result = this.checkAttachSingle(statement, dataObject);
        if (result) return {data: result};

    }

    /**
     * checks if the relation has to be adjusted and returns a new array if so
     */
    protected checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {

        // the relations
        let relations : any[] = dataObject[statement.objectKey()];

        let array: any[] = [];
        let check: boolean;

        // we check if we need to detach something according to whereHasNot
        let result: any[] = this.checkDetachArray(statement, relations);
        if (result) {
            // array = result;
            check = true;
        } else {
            result = relations;
        }


        // we check every object if the relations have been changed, push according to the result
        for (let obj of result) {
            let resultNested: any = this.checkRelationData(statement, obj);

            if (resultNested) {
                check = true;
                array.push(resultNested);
            } else {
                array.push(obj);
            }
        }

        let primaryKeyOrigin: string = vault.get(statement.origin).primaryKey;
        let primaryKeyRelation: string = vault.get(statement.key).primaryKey;

        // if the key is in the attacher we attach normally
        let attacherResult = this.typeCollector.get(statement.origin, dataObject[primaryKeyOrigin], statement.key);
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

                    let newModel = modelStamps.added(new model(obj), this.collector.timeStamp);

                    if (statement.has()) {
                        array.push(statement.attach(statement.origin, newModel))
                    } else {
                        array.push(newModel);
                    }

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
        if (!statement.whereStatementController || (
                !statement.whereStatementController.hasWhereNotHas() &&
                !statement.whereStatementController.hasWhereHas()
            )
        ) return;

        return !statement.whereStatementController.check(relation);
    }

    /**
     * checks if the array contains any data that needs to be removed according to the whereHasNot
     */
    private checkDetachArray(statement: JoinStatement, relations: any[]): any[] {
        if (relations.length === 0) return;

        if (!statement.whereStatementController || (
            !statement.whereStatementController.hasWhereNotHas() &&
            !statement.whereStatementController.hasWhereHas()
        )) return;


        let check: boolean;

        //checks every object if it still passes the check
        let array: any[] = relations.filter((obj: any) => {
            if (statement.whereStatementController.check(obj)) {
                return true;
            } else {
                check = true;
                modelStamps.removed(obj);
                return false;
            }
        });

        if (check) return array;
    }

    /**
     * adds an object based on whereHas statement
     */
    private checkAttachSingle(statement: JoinStatement, dataObject: any): any {

        // if there is no hasWhereNot has return;
        if (!statement.whereStatementController || !statement.whereStatementController.hasWhereHas()) return;

        let primaryKey: string = vault.get(statement.origin).primaryKey;

        // gets the relation obj
        let result: any = vault.get(statement.origin).getRelations(statement.key, dataObject[primaryKey]).data;

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

            let newModel = modelStamps.added(new model(obj), this.collector.timeStamp);

            // if there are nested relations add them, if not just the model
            if (statement.has()) {
                array.push(statement.attach(statement.key, newModel));
            } else {
                array.push(newModel);
            }

        }
        return (this.orderArray(statement, array));
    }

}