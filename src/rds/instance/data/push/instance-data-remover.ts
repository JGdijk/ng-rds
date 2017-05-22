import {InstanceData} from "../instance-data";
import {CollectorDataObject} from "../../../collector/collector";
import {vault} from "../../../vault/vault";

export class InstanceDataRemover {

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

        return this.check
    }

    private processTarget(collectorData: CollectorDataObject): CollectorDataObject {
        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!collectorData.hasOwnProperty(key)) return collectorData;

        let data = collectorData[key];

        // check if it matches any id's
        if (this.data.hasIds()) {
            data = this.filterIds(data);
        }

        let primaryKey = vault.get(key).primaryKey;

        this.data.data = this.data.data.filter(obj => {
           if (!data.includes(obj[primaryKey])) {
               return true;
           } else {
               this.isChecked();
               return false;
           }
        });

        delete collectorData[key]; //todo here should be an if when the target key is also used as a deeply nested relation

        return collectorData;
    }

    private processRelations(data: CollectorDataObject): void {
        for (let key in data) {
            this.processRelation(key, data[key]);
        }
    }

    private processRelation(key: string, data: any[]): void {

        let objectKey = vault.get(this.data.key).relations.use(key).objectKey;
        let pivot = vault.get(this.data.key).relations.use(key).pivot;

        let primaryKey = vault.get(key).primaryKey;

        for (let id of data) {
            for (let i in this.data.data) {
                let check = false;
                this.data.data[i][objectKey] = this.data.data[i][objectKey].filter(obj => {
                    if (obj[primaryKey] !== id) {
                        return true;
                    }
                    if (!pivot) check = true;
                    this.isChecked();
                    return false;
                });
                if (check) break;
            }

        }
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

    private filterIds(data: any[]): any[] {
        // return data.filter(id => this.data.ids.includes(id));
        return data.filter(id => () => {
            if (this.data.ids === id) return true;
        });
    }

    private isChecked(): void {
        if (!this.check) this.check = true;
    }
}