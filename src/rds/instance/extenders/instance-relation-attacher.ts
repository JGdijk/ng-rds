import {vault} from "../../vault/vault";

export class InstanceRelationAttacher {

    constructor(private name: string,
                private relation: string,
                private relation_ids: number | number[]) {}

    public to(ids: number | number[]): void{
        vault.attach(this.name, ids, this.relation, this.relation_ids);
    }

}