import {VaultRelation, RelationKey, InstantiateRelationObject, ActivateRelationObject} from "./vault-relation";
import {ModelConfig, ModelConfigRelation, ModelRelation} from "../model/model";
import {vault} from "./vault";

export type VaultRelationsObject = {
    [key: string]: VaultRelation;
}

export class VaultRelations {

    private origin: string;

    public relations: VaultRelationsObject = {};

    private modelConfig: ModelConfig;

    constructor(modelConfig: ModelConfig) {
        this.modelConfig = modelConfig;
        this.origin = new modelConfig.model().constructor.name;
    }

    /*************************** public functions ***************************
     ******************************************************************/

    public activate(): void {
        this.setRelations(this.modelConfig.relations);
        // this.setKeys(); // todo we want to set the keys so we can easily check
    }

    public add(name: string): void {
        if (this.relations[name]) return;
        this.addDullRelation(name);
    }

    public has(key?: string): boolean {
        if (key) {
            return !!(this.relations[key]);
        } else {
            return (Object.keys(this.relations).length > 0);
        }
    }

    public relationName(key: string): string {
        key = key.toLowerCase();

        for (let i in this.relations) {
            for (let relationKey of this.relations[i].names().options) {
                if (relationKey.toLowerCase() === key) {
                    return this.relations[i].names().name;
                }
            }
        }
        //todo throw error if nothing is found?
    }

    public keys(): RelationKey[] {
        let array: RelationKey[] = [];
        for (let i in this.relations) {
            for (let key of this.relations[i].keys()) {
                array.push(key);
            }
        }
        return array;
    }

    public objectKeys(): string[] {
        let array: string[] = [];

        for (let i in this.relations) {
            array.push(this.relations[i].objectKey);
        }

        return array;
    }

    public use(key: string): VaultRelation {
        return this.relations[key];
    }

    /*************************** private function ***************************
     ******************************************************************/

    private setRelations(relations: ModelConfigRelation): void {
        for (let i in relations) {
            this.addRelation(relations[i], i);
        }
    }

    private addRelation(relation: ModelRelation, objectKey: string): void {

        // get the name of the relations model
        let name: string = new relation.model().constructor.name;

        // create an object to create or activate a full relation
        let relation_object: ActivateRelationObject = {
            type: relation.type,
            objectKey: objectKey,
            relationKey: relation.relationId
        };

        // we have to check if a reversed relation(dull) has been set already, if so we activate instead of add
        if (!this.relations[name]) {
            this.addFullRelation(name, relation_object)
        } else {
            this.activateDullRelation(name, relation_object);
        }

        // we also have to set the reversed relation for easy look up + events check up
        vault.get(name).relations.add(this.origin);
    }

    private addFullRelation(key: string, relation: ActivateRelationObject): void {
        this.createRelation(key);
        this.activateDullRelation(key, relation);
    }

    private addDullRelation(key: string): void {
        this.createRelation(key);
    }

    private createRelation(key: string): void {
        let data: InstantiateRelationObject = {
            name: key,
            origin: this.origin,
            relationPrimaryKey: vault.get(key).primaryKey,
            originPrimaryKey: vault.get(this.origin).primaryKey
        };

        this.relations[key] = new VaultRelation(data); //todo this foreign key should not be like this
    }

    private activateDullRelation(key: string, relation: ActivateRelationObject): void {
        this.relations[key].activate(relation);
    }
}