import {InstanceData} from "../instance-data";
import {CollectorDataObject} from "../../../collector/collector";
import {vault} from "../../../vault/vault";
import {VaultRelation} from "../../../vault/vault-relation";

export class InstanceDataAdder {

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

        //checks if any data changes according to any relation connected to this instance;
        this.processRelations(data);

        this.data.order();

        // only returns true if anything has been added
        return this.check;
    }

    /*************************** helper function ***************************
     ******************************************************************/

    private checkKeys(data: CollectorDataObject): boolean {
        for (let key in data) {
            if (this.data.hasKey(key)) return true;
        }
        return false;
    }

    private stripKeys(data: CollectorDataObject): CollectorDataObject {
        console.log(JSON.parse(JSON.stringify(data)));
        for (let key in data) {
            if (!this.data.hasKey(key)) {
                delete data[key];
            }
        }
        console.log(JSON.parse(JSON.stringify(data)));
        return data;
    }

    //process the parent data;
    private processTarget(data: CollectorDataObject): CollectorDataObject {
        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!data[key]) return data;

        // check if it matches any id's
        if (this.data.hasIds()) {
            data[key] = this.filterIds(data[key]);
        }

        //filters all the parent data on set where conditions
        data[key] = this.data.whereStatementCollector.filter(data[key]);

        //if by this point we have no results anymore move on
        if (!data[key].length) return data;

        //we now know that there will be something added and thus we have to return true;
        this.isChecked();

        //we add the remaining objects to the actual data
        let model = vault.get(key).model;
        for (let obj of data[key]) {
            this.data.push(this.data.joinStatementCollector.attach(new model(obj)));
        }

        delete data[key]; //todo here should be an if when the target key is also used as a deeply nested relation
        // project.with('tasks.project');
        // if (this relations don't have this nested) delete

        return data;
    }

    private processRelations(data: CollectorDataObject): void {

        //todo at the moment we are not working with nested relations, this will change when we will start working on
        //todo that

        for (let key in data) {
            this.checkRelation(key, data[key]);
        }
    }

    private checkRelation(key: string, data: any[]): void{
        // we want to get all the matching ids for those relations so we can check if we a use for them
        let primaryKey: string = vault.get(key).primaryKey;
        let relation: VaultRelation = vault.get(key).relations.use(this.data.key);

        for(let obj of data) {
            let ids = relation.data.get(obj[primaryKey]);

            if (!ids) continue; // skip if no ids are found

            this.checkRelationObject(key, obj, ids);
        }
    }

    private checkRelationObject(key: string, obj: any, ids: number[]): void {
        // for every id we have we going to match it against the instance data
        for (let id of ids) {
            this.checkRelationObjectIds(key, obj, id);
        }
    }

    private checkRelationObjectIds(key: string, obj: any, id: number): void{


        let primaryKey: string = vault.get(this.data.key).primaryKey;
        let relation: VaultRelation = vault.get(this.data.key).relations.use(key);

        // for every id we have we going to match it against the instance data
        for (let instance_obj of this.data.data) {

            //check if the this.data.model.id is matching the id
            if (instance_obj[primaryKey] !== id ) continue;

            let model = vault.get(key).model;

            if (relation.returnArray) {
                instance_obj[relation.objectKey].push(new model(obj))
            } else {
                instance_obj[relation.objectKey] = new model(obj);
            }

            this.isChecked();

            if(!relation.pivot) return;
        }
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