import {vault} from "../vault/vault";
import {WhereStatementController} from "./controllers/where-statement-controller";
import {WhereHasCallback} from "./controllers/where-has-callback";
import {WhereStatementInterface} from "./where-statement.interface";

export class WhereHasStatement implements WhereStatementInterface{

    public origin: string;

    public key: string;

    private primaryKey;

    public whereStatementController: WhereStatementController;

    private complicated: boolean;

    constructor(statement) {
        this.origin = statement.origin;
        this.key = vault.get(this.origin).relations.relationName(statement.relation);

        this.primaryKey = vault.get(statement.origin).primaryKey;

        this.whereStatementController = new WhereStatementController(this.key);

        // check if there is a callback with have to process
        if (statement.callback) {
            this.complicated = true;
            new WhereHasCallback(this, statement.callback);
        }


    }

    public check(o: any): boolean {
        console.log('ben hier');
        let r: any = vault.get(this.origin).relations.use(this.key).find(o[this.primaryKey]);

        if (!r || r.length === 0) return;

        return (this.complicated)
            ? this.checkComplicated(r)
            : !!(r);
    }

    public has(key: string): boolean {
        if (this.key === key) return true;
        return this.whereStatementController.has(key);
    }


    private checkComplicated(ids: number[]): boolean {
        let data: any[] = vault.get(this.key).data.get(ids);

        if (data.length === 0) return;

        data = this.whereStatementController.filter(data);

        return (data.length > 0);
    }

    // get all the objects with those relations
    // filter them through the where

}