import {JoinStatement} from "../join-statement";
import {JoinCallbackStatements} from "./join-callback-statements";
export class JoinCallback {

    private statement: JoinStatement;

    constructor(statement: JoinStatement, callback: any) {
        this.statement = statement;
        callback(this);
    }

    public name(name: string) {
        this.statement.setKey(name);
        return new JoinCallbackStatements(this.statement);
    }
}