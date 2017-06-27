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
            WhereNotNullStatement
        )[] = [];

    private whereHasStatements: WhereHasStatement[] = [];
    private whereNotHasStatements: WhereNotHasStatement[] = [];

    constructor() {
    }

    public add(type: string, statement): void {
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
                this.whereHasStatements.push(new WhereHasStatement(statement));
                break;
            case 'whereNotHas':
                this.whereNotHasStatements.push(new WhereNotHasStatement(statement));
                break;
        }
    }


    public has(key?: string): boolean {
        if (!key) {
            if (this.hasWhereHas()) return true;
            if (this.hasWhereNotHas()) return true;
            return (this.whereStatements.length > 0);
        }

        if (this.hasWhereHas(key)) return true;
        return (this.hasWhereNotHas(key));
    }

    public hasWhereHas(key?: string): boolean {
        if (!key) {
            return (this.whereHasStatements.length > 0);
        }

        if (this.whereHasStatements.length === 0) return;
        for (let s of this.whereHasStatements) {
            if (s.has(key)) return true;
        }

    }

    public hasWhereNotHas(key?: string): boolean {
        if (!key) {
            return (this.whereNotHasStatements.length > 0);
        }

        if (this.whereNotHasStatements.length === 0) return;
        for (let s of this.whereNotHasStatements) {
            if (s.key === key) return true;
        }

    }



    public check(data: any): boolean {
        if (!this.checkWhereHas(data)) return false;
        if (!this.checkWhereNotHas(data)) return false;

        return this.checkWhere(data);
    }

    public checkWhere(data: any): boolean {
        for (let s of this.whereStatements) {
            if (!s.check(data)) return false;
        }
        return true;
    }

    public checkWhereHas(data: any): boolean {
        for (let s of this.whereHasStatements) {
            if (!s.check(data)) return false;
        }
        return true;
    }

    public checkWhereNotHas(data: any): boolean {
        for (let s of this.whereNotHasStatements) {
            if (!s.check(data)) return false;
        }
        return true;
    }

    public getWhereHasKeys(): string[] {
        let array: string[] = [];

        for (let s of this.whereHasStatements) {
            let key: string = s.key;
            array.push(key);
        }

        return array;
    }

    public getWhereNotHasKeys(): string[] {
        let array: string[] = [];

        for (let s of this.whereNotHasStatements) {
            let key: string = s.key;
            array.push(key);
        }

        return array;
    }

    public getWhereHasStatements(): WhereHasStatement[] {
        return this.whereHasStatements;
    }

    public getWhereNotHasStatements(): WhereNotHasStatement[] {
        return this.whereNotHasStatements;
    }
}