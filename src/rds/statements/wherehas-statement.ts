import {vault} from "../vault/vault";

export class WhereHasStatement {

    private statement;

    private primaryKey;

    constructor(statement) {
        this.statement = statement;
        this.primaryKey = vault.get(statement.origin).primaryKey;
    }

    public check(o: any): boolean {
        //todo we don't want a array.from on every object
        let ids: any = Array.from(vault.get(this.statement.origin).relations.use(this.statement.relation).data.keys());
        for (let id of ids) {
            if(o[this.primaryKey] === id) return true;
        }
        return false;
    }
}