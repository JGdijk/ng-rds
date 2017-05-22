import {InstanceData} from "../instance-data";
import {CollectorDataObject} from "../../../collector/collector";
import {VaultRelations} from "../../../vault/vault-relations";
import {vault} from "../../../vault/vault";

export class InstanceDataDetacher {

    private data: InstanceData;

    private check: boolean;

    constructor(instanceData: InstanceData) {
        this.data = instanceData;
    }

    public run(data: CollectorDataObject): boolean {

        //if non of the attached keys matches the instance's return false
        if (!this.checkKeys(data)) return false;

        this.check = false;

        data = this.stripKeys(data);

        let vaultRelations: VaultRelations = vault.get(this.data.key).relations;

        // for each relation in the collector
        for (let key in data) {
            // primary key of the instance parent data;
            let primaryKey = vault.get(this.data.key).primaryKey;
            // object key for the relation
            let objectKey = vaultRelations.use(key).objectKey;

            //for each id in the relation
            data_loop: for (let id in data[key]) {
                //check against instance data;
                for (let obj of this.data.data) {
                    if (obj[primaryKey] != id) continue;

                    let primaryKey_relation = vault.get(key).primaryKey;
                    //detach every model to the instance data relation;
                    obj[objectKey] = obj[objectKey].filter(o => !data[key][id].includes(o[primaryKey_relation]));

                    this.isChecked();
                    continue data_loop;
                }
            }
        }

        return this.check;
    }

    private checkKeys(data: CollectorDataObject): boolean {
        if (!data.hasOwnProperty(this.data.key)) return false;

        for (let key in data[this.data.key]) {
            if (this.data.joinStatementCollector.has(key)) return true;
        }

        return false;
    }

    private stripKeys(data: CollectorDataObject): CollectorDataObject {
        data = data[this.data.key];

        for (let key in data) {
            if (!this.data.joinStatementCollector.has(key)) delete data[key];
        }

        return data;
    }

    private isChecked(): void {
        if (!this.check) this.check = true;
    }
}