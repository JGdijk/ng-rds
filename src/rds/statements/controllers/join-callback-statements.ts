import {JoinStatement} from "../join-statement";
export class JoinCallbackStatements {

    private statement: JoinStatement;

    constructor(statement: JoinStatement) {
        this.statement = statement;
    }

    public join(key: string | string[] | any): JoinCallbackStatements {
        this.statement.joinStatementController.add(key);
        return this;
    }

    public orderBy(key: string | any[], order?: string): JoinCallbackStatements {
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

    public where(key: string | any | any[], action?: string, value?: string | number): JoinCallbackStatements {
        // one single where statement
        if (action) {
            this.statement.whereStatementController.add('where', [{key: key, action: action, value: value}]);
        } else { // array
            this.statement.whereStatementController.add('where', key);
        }
        return this;
    }

    public orWhere(key: string | any | any[], action?: string, value?: string | number): JoinCallbackStatements {
        // one single where statement //todo make type for any[]
        if (action) {
            this.statement.whereStatementController.add('orWhere', [{key: key, action: action, value: value}]);
        } else { // multiple statements or callback
            this.statement.whereStatementController.add('orWhere', key)
        }
        return this;

    }

    public whereBetween(key: string, min: number, max: number): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereNotBetween(key: string, min: number, max: number): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereNotBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereIn(key: string, values: any[]): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereIn', [{key: key, values: values}]);
        return this;
    }

    public whereNotIn(key: string, values: any[]): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereNotIn', [{key: key, values: values}]);
        return this;
    }

    public whereNull(key: string): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereNull', [key]);
        return this;
    }

    public whereNotNull(key: string): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereNotNull', [key]);
        return this;
    }

    public whereHas(key: string): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereHas', [{origin: this.statement.key ,relation: key}]);
        return this;
    }

    public whereNotHas(key: string): JoinCallbackStatements {
        this.statement.whereStatementController.add('whereNotHas', [{origin: this.statement.key ,relation: key}]);
        return this;
    }


}