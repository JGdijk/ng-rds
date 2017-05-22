import {WhereStatement} from "../where-statement";

export class WhereStatementController {

    private whereStatements: WhereStatement[] = [];

    constructor(){}

    public add(type: string, statement): void {
        switch(type) {
            case 'where':
                this.whereStatements.push(new WhereStatement(statement));
                break;
        }
    }

    public has(): boolean { //todo this can be extended when add more where functionality
        return (this.whereStatements.length > 0);
    }

    public filter(data: any[]): any[] { //todo this can be devided into multiple functions when extended
        for (let s of this.whereStatements) {
            data = s.filter(data);
        }
        return data;
    }

    public check(data: any): boolean {
        for (let s of this.whereStatements) {
            if (!s.check(data)) return false;
        }
        return true;
    }
}