import {WhereStatementInterface} from "./where-statement.interface";

export class WhereNullStatement implements WhereStatementInterface{

    private key;

    constructor(key) {
        this.key = key;
    }

    public check(o: any): boolean {
        return (o[this.key] === null || o[this.key] === undefined)
    }
}