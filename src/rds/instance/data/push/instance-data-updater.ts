import {InstanceData} from "../instance-data";
import {CollectorDataObject} from "../../../collector/collector";
import {vault} from "../../../vault/vault";
import {VaultRelation} from "../../../vault/vault-relation";

export class InstanceDataUpdater {

    private data: InstanceData;

    private check: boolean;

    constructor(instanceData: InstanceData) {
        this.data = instanceData;
    }

    public run(data: CollectorDataObject): boolean {

        //if non of the added keys matches the instance's return false
        if (!this.checkKeys(data)) return false;

        //keep track if anything has been added
        this.check = false;

        //we don't need any of the data this instance doesn't contain or is related to with a relation
        data = this.stripKeys(data);

        //checks if any of the main data needs to be added directly
        data = this.processTarget(data);

        this.processRelations(data);

        this.data.order();

        return this.check;
    }

    private checkKeys(data: CollectorDataObject): boolean {
        for (let key in data) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }

    private stripKeys(data: CollectorDataObject): CollectorDataObject {
        for (let key in data) {
            if (!this.data.hasKey(key)) {
                delete data[key];
            }
        }
        return data;
    }

    //process the parent data;
    private processTarget(collectorData: CollectorDataObject): CollectorDataObject {
        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!collectorData.hasOwnProperty(key)) return collectorData;

        let data = collectorData[key];

        // check if it matches any id's
        if (this.data.hasIds()) {
            data = this.filterIds(data);
        }

        //check if it is in data
        data = this.inTarget(data);

        //if not in where anymore since the update delete
        for (let i in data) {
            if (this.data.whereStatementController.check(data[i])) continue;
            delete data[i];
        }

        //if by this point we have no results anymore move on
        if (!data.length) {
            delete collectorData[key];
            return collectorData;
        }

        //we now know that there will be something added and thus we have to return true;
        this.isChecked();

        //check if it has relations (transfer them to new updated model
        data = this.transferRelations(data);

        //we exchange the remaining objects to the actual data
        let model = vault.get(key).model;
        let primaryKey = vault.get(key).primaryKey;
        obj_loop: for (let obj of data) {
            for (let i in this.data.data) {
                if (obj[primaryKey] !== this.data.data[i][primaryKey]) continue;
                this.data.replace(i, new model(obj));
                continue obj_loop;
            }
        }

        delete collectorData[key]; //todo here should be an if when the target key is also used as a deeply nested relation

        return collectorData;
    }

    private processRelations(data: CollectorDataObject): void {
        for (let key in data) {
            this.processRelation(key, data[key]);
        }
    }

    private processRelation(key: string, data: any[]): void {
        // get the primary key for this relation obj
        let primaryKey: string = vault.get(key).primaryKey;

        //get the model for this relation
        let model: any = vault.get(key).model;

        // get the relation info from the parent view
        let relation: VaultRelation = vault.get(this.data.key).relations.use(key);

        obj_loop: for (let obj of data) { // loops trough the data we got from the collector
            for (let instance_obj of this.data.data) { // loops trough the existing data
                for (let i in instance_obj[relation.objectKey]) { //checks the collector data against the existing relation data

                    if (obj[primaryKey] !== instance_obj[relation.objectKey][i][primaryKey]) continue;

                    instance_obj[relation.objectKey].splice(i, 1);
                    instance_obj[relation.objectKey].push(new model(obj));

                    this.isChecked();

                    // we want to check if there is a possibility this relation exists on multiple objects
                    if (!relation.pivot) {
                        continue obj_loop;
                    } else {
                        break;
                    }
                }
            }
        }
    }

    private inTarget(data: any[]): any[] {
        let primaryKey = vault.get(this.data.key).primaryKey;

        return data.filter(obj => {
            for (let d of this.data.data) {
                if (d[primaryKey] === obj[primaryKey]) return true;
            }
            return false;
        })
    }

    private transferRelations(data: any[]): any[] {
        if (!this.data.joinStatementController.has()) return data;

        let keys: string[] = this.data.joinStatementController.objectKeys();
        let primaryKey: string = vault.get(this.data.key).primaryKey;

        // we compare every instance object against the to be added object
        obj_loop: for (let obj of data) {
            for (let instance_obj of this.data.data) {
                if (obj[primaryKey] !== instance_obj[primaryKey]) continue;

                // now we will transfer every relation to the new object, this way we will get a new object
                // but with the same relation objects to trigger change effects only on the target and not on the
                // relations
                for (let key of keys) {
                    obj[key] = instance_obj[key];
                }
                continue obj_loop;
            }
        }
        return data;
    }

    /*************************** helper ***************************
     ******************************************************************/

    private isChecked(): void {
        if (!this.check) this.check = true;
    }

    private filterIds(data: any[]): any[] {
        let primaryKey = vault.get(this.data.key).primaryKey;
        // return data.filter(obj => this.data.ids.includes(obj[primaryKey]));
        return data.filter(obj => () => {
            if (this.data.ids === obj[primaryKey]) return true;
        });
    }

}