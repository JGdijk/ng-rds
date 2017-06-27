import {WhereHasStatement} from "../wherehas-statement";

export class WhereHasCallback {

    private statement: WhereHasStatement;

    constructor(statement: WhereHasStatement, callback: any) {
        this.statement = statement;
        callback(this);
    }

    public where(key: string | any | any[], action?: string, value?: string | number): WhereHasCallback {
        // one single where statement
        if (action) {
            this.statement.whereStatementController.add('where', [{key: key, action: action, value: value}]);
        } else { // array
            this.statement.whereStatementController.add('where', key);
        }
        return this;
    }

    public orWhere(key: string | any | any[], action?: string, value?: string | number): WhereHasCallback {
        // one single where statement //todo make type for any[]
        if (action) {
            this.statement.whereStatementController.add('orWhere', [{key: key, action: action, value: value}]);
        } else { // multiple statements or callback
            this.statement.whereStatementController.add('orWhere', key)
        }
        return this;

    }

    public whereBetween(key: string, min: number, max: number): WhereHasCallback {
        this.statement.whereStatementController.add('whereBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereNotBetween(key: string, min: number, max: number): WhereHasCallback {
        this.statement.whereStatementController.add('whereNotBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereIn(key: string, values: any[]): WhereHasCallback {
        this.statement.whereStatementController.add('whereIn', [{key: key, values: values}]);
        return this;
    }

    public whereNotIn(key: string, values: any[]): WhereHasCallback {
        this.statement.whereStatementController.add('whereNotIn', [{key: key, values: values}]);
        return this;
    }

    public whereNull(key: string): WhereHasCallback {
        this.statement.whereStatementController.add('whereNull', [key]);
        return this;
    }

    public whereNotNull(key: string): WhereHasCallback {
        this.statement.whereStatementController.add('whereNotNull', [key]);
        return this;
    }

    public whereHas(key: string | string[], callback?: any): WhereHasCallback {
        if (!Array.isArray(key)) {
            this.statement.whereStatementController.add('whereHas', [{origin: this.statement.key ,relation: key, callback: callback}]);
        } else {
            if (callback){
                //todo throw big error now allowed with array
            }
            for (let s of key) {
                this.statement.whereStatementController.add('whereHas', [{origin: this.statement.key ,relation: s, callback: callback}]);
            }
        }
        return this;
    }

    public whereNotHas(key: string | string[]): WhereHasCallback {
        if (!Array.isArray(key)) {
            this.statement.whereStatementController.add('whereNotHas', [{origin: this.statement.key ,relation: key}]);
        } else {
            for (let s of key) {
                this.statement.whereStatementController.add('whereNotHas', [{origin: this.statement.key ,relation: s}]);
            }
        }
        return this;
    }
}