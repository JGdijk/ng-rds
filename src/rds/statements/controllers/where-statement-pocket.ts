import {WhereStatement} from "../where-statement";
import {WhereBetweenStatement} from "../wherebetween-statement";
import {WhereNotBetweenStatement} from "../wherenotbetween-statement";
import {WhereInStatement} from "../wherein-statement";
import {WhereNotInStatement} from "../wherenotin-statement";
import {WhereNullStatement} from "../wherenull-statement";
import {WhereNotNullStatement} from "../wherenotnull-statement";
import {WhereHasStatement} from "../wherehas-statement";
import {WhereNotHasStatement} from "../wherenothas-statement";

export class WhereStatementPocket {

    private whereStatements: (
            WhereStatement |
            WhereBetweenStatement |
            WhereNotBetweenStatement |
            WhereInStatement |
            WhereNotInStatement |
            WhereNullStatement |
            WhereNotNullStatement |
            WhereHasStatement |
            WhereNotHasStatement
        )[] = [];

    constructor() {
    }

    public add(type: string, statement): void {
        console.log(statement);
        switch (type) {
            case 'where':
                this.whereStatements.push(new WhereStatement(statement));
                break;
            case 'whereBetween':
                this.whereStatements.push(new WhereBetweenStatement(statement));
                break;
            case 'whereNotBetween':
                this.whereStatements.push(new WhereNotBetweenStatement(statement));
                break;
            case 'whereIn':
                this.whereStatements.push(new WhereInStatement(statement));
                break;
            case 'whereNotIn':
                this.whereStatements.push(new WhereNotInStatement(statement));
                break;
            case 'whereNull':
                this.whereStatements.push(new WhereNullStatement(statement));
                break;
            case 'whereNotNull':
                this.whereStatements.push(new WhereNotNullStatement(statement));
                break;
            case 'whereHas':
                this.whereStatements.push(new WhereHasStatement(statement));
                break;
            case 'whereNotHas':
                this.whereStatements.push(new WhereNotHasStatement(statement));
                break;
        }
    }


    public has(): boolean { //todo this can be extended when add more where functionality
        return (this.whereStatements.length > 0);
    }

    // public filter(data: any[]): any[] { //todo this can be devided into multiple functions when extended
    //     for (let s of this.whereStatements) {
    //         data = s.filter(data);
    //     }
    //     return data;
    // }

    public check(data: any): boolean {
        for (let s of this.whereStatements) {
            if (!s.check(data)) return false;
        }
        return true;
    }

}