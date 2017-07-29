import {InstanceData} from "../instance-data";
import {Collector} from "../../../collector/collector";
import {AttachCollector} from "../../../collector/collectors/attach-collector";
import {InstanceDataPusherInterface} from "../instance-data-pusher.interface";
import {vault} from "../../../vault/vault";
import {JoinStatementController} from "../../../statements/controllers/join-statement-controller";
import {JoinStatement} from "../../../statements/join-statement";
import {ProcessUnit} from "../../../process/process-unit";
import {AddCollector} from "../../../collector/collectors/add-collector";
import {DetachCollector} from "../../../collector/collectors/detach-collector";
import {RemoveCollector} from "../../../collector/collectors/remove-collector";
import {UpdateCollector} from "../../../collector/collectors/update-collector";
import {modelStamps} from "../../../model/model-stamps";

export abstract class InstanceDataPush {

    protected data: InstanceData;

    protected collector: Collector;

    protected typeCollector: AddCollector & AttachCollector & DetachCollector & RemoveCollector & UpdateCollector;

    protected newData: any[];

    protected abstract type: string;

    constructor(instanceData: InstanceData) {
        this.data = instanceData;
    }

    protected processRelations(): void {
        if (!this.data.joinStatementController.has() || this.data.primaryOnly) return;

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
    protected checkRelationData(controller: InstanceDataPusherInterface, data: any): any {
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
            return modelStamps.relationUpdated(new model(newObj), this.collector.timeStamp);
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
                array.push(modelStamps.relationUpdated(new model(innerObj), this.collector.timeStamp));
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

    protected abstract checkRelationStatementObject(statement: JoinStatement, dataObject: any): any
    protected abstract checkRelationStatementArray(statement: JoinStatement, dataObject: any[]): any[]

    /*************************** helpers ***************************
     ******************************************************************/

    protected checkKeys(collector: Collector): boolean {
        for (let key of collector.use(this.type).keys()) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }

    protected init(processUnit: ProcessUnit): void {
        this.collector = processUnit.collector;
        this.typeCollector = processUnit.collector.use(this.type);
        this.newData = processUnit.data;
    }

    protected orderArray(controller: InstanceDataPusherInterface, array: any[]): any[] {
        return (controller.orderByStatementController.has())
            ? controller.orderByStatementController.init(array)
            : array
    }

    protected transferRelations(keys: string[], oldObject: any, newObject: any): any {
        for (let key of keys) {
            if (oldObject.hasOwnProperty(key)) {
                newObject[key] = oldObject[key];
            }
        }
        return newObject
    }

}