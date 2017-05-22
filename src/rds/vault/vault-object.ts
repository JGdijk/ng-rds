import {VaultRelations} from "./vault-relations";
import {InstanceController} from "../instance/instance-controller";
import {VaultData} from "./vault-data";
import {ModelConfig} from "../model/model";
import {Collector} from "../collector/collector";
import {vault} from "./vault";


export type RelationWithObject = {
    name: string,
    data: any | any[]
}

export class VaultObject {

    public name: string;

    public data: VaultData;

    public relations: VaultRelations;

    public instance: InstanceController;

    public model: any;

    public primaryKey: string;

    public constructor(model: ModelConfig) {
        this.name = model.name;
        this.data = new VaultData(model.primaryKey);
        this.relations = new VaultRelations(model);
        this.instance = new InstanceController(model.name);
        this.model = model.model;

        this.setPrimaryKey(model.primaryKey);
    }

    public add(objects: any | any[], collector: Collector): Collector {
        // we always want to work with an array
        objects = (Array.isArray(objects)) ? objects : [objects];

        // if there are no relations we can simply add the objects
        if (!this.relations.has()) {
            for (let obj of objects) {
                this.data.add(obj);
                collector.add(this.name, obj);
            }
            return collector;
        }

        // now we have to check if each object has any relation info
        for (let obj of objects) {
            for (let key of this.relations.keys()) {
                // if the object doesn't contain this key continue;
                if (!obj[key.key]) continue;

                // check if we need to add an actual object or just the relations
                if (key.object) {
                    //check if the result is an array of objects or a singel object
                    if (key.array) {
                        for (let relation of obj[key.key]) {
                            this.addRelation(obj[this.primaryKey], key.name, relation[vault.get(key.name).primaryKey])
                        }
                    } else {
                        this.addRelation(obj[this.primaryKey], key.name, obj[key.key][vault.get(key.name).primaryKey])
                    }
                    //add the object
                    vault.get(key.name).add(obj[key.key], collector);
                } else {
                    //check if the result is an array of ids or a singel id
                    if (key.array) {
                        for (let id of obj[key.key]) {
                            this.addRelation(obj[this.primaryKey], key.name, id);
                        }
                    } else {
                        this.addRelation(obj[this.primaryKey], key.name, obj[key.key]);
                    }
                }

                delete obj[key.key];
            }
            this.data.add(obj);
            collector.add(this.name, obj);
        }

        return collector
    }

    public update(ids: number[], data: any, collector: Collector): Collector {

        //todo we might want improve the update by accepting relation keys?

        //make sure primary keys are not being overwritten
        for (let key of data){
            if (key === this.primaryKey) delete data[key];
        }

        for (let id of ids) {
            this.data.update(id, data);
            collector.add(this.name, this.data.find(id));
        }

        return collector
    }

    public remove(ids: number[], collector: Collector): Collector {

        // if there are no relations we can simply remove the items
        if (!this.relations.has()) {
            console.log('geen relaties');
            for (let id of ids) {
                this.data.remove(id);
                collector.add(this.name, id);
            }
            return collector;
        }

        // if there are relations we want to remove them from the respective vaults
        for (let id of ids) {
            this.removeRelations(id);
            this.data.remove(id);
            collector.add(this.name, id);
        }

        return collector;
    }

    public attach(ids: number[],
                  relation: string,
                  relationIds: number[],
                  collector: Collector): Collector {

        //adding relation connections
        let vaultRelation = this.relations.use(relation);
        for (let id of ids) {
            vaultRelation.add(id, relationIds);
            collector.push(this.name, relation, id, relationIds);
        }

        //adding mirror connections
        let vaultRelationMirror = vault.get(relation).relations.use(this.name);
        for (let relationId of relationIds) {
            vaultRelationMirror.add(relationId, ids);
            collector.push(relation, this.name, relationId, ids);
        }
        return collector;
    }

    public detach(ids: number[],
                  relation: string,
                  relationIds: number[],
                  collector: Collector): Collector {

        // if all connections need to be destroyed we can simply remove them;
        if (!relationIds) {
            for (let id of ids) {
                collector = this.detachRelation(relation, id, collector);
            }
            //collector
            return collector;
        }

        //detach the relations
        let vaultRelation = this.relations.use(relation);
        for (let id of ids) {
            vaultRelation.detach(id, relationIds);
            collector.push(this.name, relation, id, relationIds);
        }
        //detach the mirror
        let vaultRelationMirror = vault.get(relation).relations.use(this.name);
        for (let relationId of relationIds) {
            vaultRelationMirror.detach(relationId, ids);
            collector.push(relation, this.name, relationId, ids);
        }
        return collector;
    }


    public getRelations(key: string, id: number): RelationWithObject {
        let relation = this.relations.use(key);

        let ids: number | number[] = relation.data.get(id);

        // if no results are found for this relation return
        if (!ids || ids.length < 1) {
            return {
                name: relation.objectKey,
                data: relation.emptyObject()
            }
        }

        let vaultObject = vault.get(key);

        // check if we need to return an array or a single result depending on the relation type
        if (relation.returnArray) {
            let array: any[] = [];

            for (let id of ids) {
                let obj: any = vaultObject.data.find(id);
                if (obj) array.push(new vaultObject.model(obj));
            }

            // if no matching object where found by the ids we return empty, else we return the object(s)
            return {
                name: relation.objectKey,
                data: (array.length > 0) ? array : relation.emptyObject()
            }
        } else {
            let obj: any = vaultObject.data.find(id);

            // if no matching object where found by the id we return empty, else we return the object
            return {
                name: relation.objectKey,
                data: (obj) ? new vaultObject.model(obj) : relation.emptyObject()
            }
        }


    }


    /*************************** helper functions ***************************
     ******************************************************************/

    private addRelation(id: number, relationName: string, relationId: number): void {
        // saving the relation
        this.relations.use(relationName).add(id, relationId);
        // saving the mirror relation
        vault.get(relationName).relations.use(this.name).add(relationId, id);
    }

    private removeRelations(id: number): void {
        for (let i in this.relations.relations) {
            let relation = this.relations.use(i);
            let ids = relation.find(id);
            if (!ids) continue;

            //remove the relation
            relation.remove(id);
            //remove all the mirror relations
            for (let relationId of ids) {
                vault.get(i).relations.use(this.name).detach(relationId, id);
            }
        }
    }

    private detachRelation(relation: string, id: number, collector: Collector): Collector {
        let vaultRelation = this.relations.use(relation);

        //get all the relation ids
        let relationIds = vaultRelation.find(id);

        //check if it contains any id
        if(!relationIds || relationIds.length === 0) return collector;

        //remove the relation
        vaultRelation.remove(id);

        //add it to the collector
        collector.push(this.name, relation, id, relationIds);

        // detaching the mirror
        let vaultRelationMirror = vault.get(relation).relations.use(this.name);

        for (let relationId of relationIds) {
            vaultRelationMirror.detach(relationId, id);
            collector.push(relation, this.name, relationId, id);
        }

        return collector;
    }

    private setPrimaryKey(key: string): void {
        this.primaryKey = (key) ? key : 'id';
    }
}