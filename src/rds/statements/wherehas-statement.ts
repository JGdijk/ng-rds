import {vault} from "../vault/vault";

export class WhereHasStatement {

    public statement;

    private primaryKey;

    constructor(statement) {
        this.statement = statement;
        this.primaryKey = vault.get(statement.origin).primaryKey;
    }

    public check(o: any): boolean {
        let r: any = vault.get(this.statement.origin).relations.use(this.statement.relation).find(o[this.primaryKey]);
        return !!(r);
    }
}