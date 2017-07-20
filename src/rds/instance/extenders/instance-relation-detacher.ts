import {vault} from "../../vault/vault";

export class InstanceRelationDetacher {

    constructor(private name: string,
                private relation: string,
                private relation_ids: string| number | number[]) {}

    public from(ids:  number | number[]): void{
        vault.detach(this.name, ids, this.relation, this.relation_ids);
    }
}