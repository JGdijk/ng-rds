import {vault} from "../vault/vault";
import {ModelStamp} from "./model-stamp";

export type ModelRelation = {
    type: string,
    model: any
    relationId?: string
}

export type ModelConfigRelation = {
    [key: string]: ModelRelation;
}

export interface ModelConfig {
    name?: string,
    model: any //todo make this in een extended model type?
    primaryKey?: string
    relations?: {
        [key: string]: ModelRelation;
    };
}


export class Model{

    constructor(data: any){
        Object.assign(this, data);
    }

    public save(): void{
        let name = this.constructor.name;
        let data: any = Object.assign({}, this);

        let primaryKey: string = vault.get(name).primaryKey;

        if (vault.get(name).data.find(this[primaryKey])) {
            vault.update(name, this[primaryKey], data);
        } else {
            vault.add(name, data);
        }
    };

    public update(data: any): void {
        let name = this.constructor.name;
        vault.update(name, this[vault.get(name).primaryKey], data);
    }

    public remove(): void {
        vault.remove(this.constructor.name, this[vault.get(this.constructor.name).primaryKey])
    }

    public attach(relation: string, ids: number | number[]): void {
        vault.attach(
            this.constructor.name,
            this[vault.get(this.constructor.name).primaryKey],
            relation,
            ids
        );
    }

    public detach(relation: string, ids: string | number | number[]): void {
        vault.detach(
            this.constructor.name,
            this[vault.get(this.constructor.name).primaryKey],
            relation,
            ids
        );
    }

    public modelStamp: ModelStamp;

    // public modelStamp(): ModelStamp {
    //     return this.constructor.prototype.modelStamp;
    // };
}