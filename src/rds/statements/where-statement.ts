import {WhereStatementInterface} from "./where-statement.interface";
import {WhereStatementController} from "./controllers/where-statement-controller";

export class WhereStatement implements WhereStatementInterface{

    private statement;

    public whereStatementController: WhereStatementController;

    constructor(statement: any = null) {
        this.statement = statement;
    }


    public filter(data: any[]): any[] {
        return data.filter(obj => this.check(obj))
    }

    public check(o: any): boolean {

        if (this.statement === null) return this.whereStatementController.check(o);

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

    public initController(key: string): void {
        if (this.whereStatementController === undefined) {
            this.whereStatementController = new WhereStatementController(key)
        }
    }
}

