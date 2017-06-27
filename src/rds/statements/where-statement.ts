import {WhereStatementInterface} from "./where-statement.interface";

export class WhereStatement implements WhereStatementInterface{

    private statement;

    constructor(statement) {
        this.statement = statement;
    }

    public filter(data: any[]): any[] {
        return data.filter(obj => this.check(obj))
    }

    public check(o: any): boolean {
        let s = this.statement;

        switch (s.action) {
            case '=':
                return (o[s.key] === s.value);
            case '!=':
                return (o[s.key] !== s.value);
            case '>':
                return (o[s.key] > s.value);
            case '<':
                return (o[s.key] < s.value);
            default:
                return false;
        }
    }
}

