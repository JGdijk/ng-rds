import {WhereStatementInterface} from "./where-statement.interface";

export class WhereBetweenStatement implements WhereStatementInterface{

    private statement;

    constructor(statement) {
        this.statement = statement;
    }

    public check(o: any): boolean {
        let s = this.statement;
        return (o[s.key] >= s.min && o[s.key] <= s.max);
    }
}

