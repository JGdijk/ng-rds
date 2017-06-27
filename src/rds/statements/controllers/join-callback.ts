import {JoinStatement} from "../join-statement";

export class JoinCallback {

    private statement: JoinStatement;

    constructor(statement: JoinStatement, callback: any) {
        this.statement = statement;
        callback(this);
    }

    public join(key: string | string[], callback: any = null): JoinCallback {
        this.statement.joinStatementController.add(key, callback);
        return this;
    }

    public orderBy(key: string | any[], order?: string): JoinCallback {
        if (order) {
            this.statement.orderByStatementController.add({key: key, order: order});
        } else {
            for (let i = 0; i < key.length; i ++) {
                let s = key[i];
                this.statement.orderByStatementController.add({key: s[0], order: s[1]});
            }
        }
        return this;
    }

    public where(key: string | any | any[], action?: string, value?: string | number): JoinCallback {
        // one single where statement
        if (action) {
            this.statement.whereStatementController.add('where', [{key: key, action: action, value: value}]);
        } else { // array
            this.statement.whereStatementController.add('where', key);
        }
        return this;
    }

    public orWhere(key: string | any | any[], action?: string, value?: string | number): JoinCallback {
        // one single where statement //todo make type for any[]
        if (action) {
            this.statement.whereStatementController.add('orWhere', [{key: key, action: action, value: value}]);
        } else { // multiple statements or callback
            this.statement.whereStatementController.add('orWhere', key)
        }
        return this;

    }

    public whereBetween(key: string, min: number, max: number): JoinCallback {
        this.statement.whereStatementController.add('whereBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereNotBetween(key: string, min: number, max: number): JoinCallback {
        this.statement.whereStatementController.add('whereNotBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereIn(key: string, values: any[]): JoinCallback {
        this.statement.whereStatementController.add('whereIn', [{key: key, values: values}]);
        return this;
    }

    public whereNotIn(key: string, values: any[]): JoinCallback {
        this.statement.whereStatementController.add('whereNotIn', [{key: key, values: values}]);
        return this;
    }

    public whereNull(key: string): JoinCallback {
        this.statement.whereStatementController.add('whereNull', [key]);
        return this;
    }

    public whereNotNull(key: string): JoinCallback {
        this.statement.whereStatementController.add('whereNotNull', [key]);
        return this;
    }

    //todo callback
    public whereHas(key: string | string[], callback?: any): JoinCallback {
        console.log(key);
        console.log(this.statement.key);
        if (Array.isArray(key)) {
            for (let k of key) {
                this.statement.whereStatementController.add('whereHas', [{origin: this.statement.key ,relation: k}]);
            }
        } else {
            this.statement.whereStatementController
                .add('whereHas', [{origin: this.statement.key ,relation: key, callback: callback}]);
        }
        return this;
    }

    public whereNotHas(key: string | string[]): JoinCallback {
        if (!Array.isArray(key)) {
            this.statement.whereStatementController.add('whereNotHas', [{origin: this.statement.key ,relation: key}]);
        } else {
            for (let k of key) {
                this.statement.whereStatementController.add('whereNotHas', [{origin: this.statement.key ,relation: k}]);
            }
        }

        return this;
    }


}