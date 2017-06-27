import {vault} from "../vault/vault";
import {WhereStatementInterface} from "./where-statement.interface";

export class WhereNotHasStatement implements WhereStatementInterface{

    public origin: string;

    public key: string;

    private primaryKey;

    constructor(statement) {
        this.origin = statement.origin;
        this.key = vault.get(this.origin).relations.relationName(statement.relation);

        this.primaryKey = vault.get(statement.origin).primaryKey;
    }

    public check(o: any): boolean {
        let r: any = vault.get(this.origin).relations.use(this.key).find(o[this.primaryKey]);
        return !(r);
    }
}