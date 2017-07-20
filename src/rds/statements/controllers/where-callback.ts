import {WhereStatementController} from "./where-statement-controller";

export class WhereCallback {

    private key: string;

    private controller: WhereStatementController;

    constructor(controller: WhereStatementController, callback: any, key: string) {
        this.key = key;
        this.controller = controller;
        callback(this);
    }

    public where(key: string | any | any[], action?: string, value?: string | number): WhereCallback {
        // one single where statement
        if (action) {
            this.controller.add('where', [{key: key, action: action, value: value}]);
        } else { // array
            this.controller.add('where', key);
        }
        return this;
    }

    public orWhere(key: string | any | any[], action?: string, value?: string | number): WhereCallback {
        // one single where statement //todo make type for any[]
        if (action) {
            this.controller.add('orWhere', [{key: key, action: action, value: value}]);
        } else { // multiple statements or callback
            this.controller.add('orWhere', key)
        }
        return this;
    }

    public whereBetween(key: string, min: number, max: number): WhereCallback {
        this.controller.add('whereBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereNotBetween(key: string, min: number, max: number): WhereCallback {
        this.controller.add('whereNotBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereIn(key: string, values: any[]): WhereCallback {
        this.controller.add('whereIn', [{key: key, values: values}]);
        return this;
    }

    public whereNotIn(key: string, values: any[]): WhereCallback {
        this.controller.add('whereNotIn', [{key: key, values: values}]);
        return this;
    }

    public whereNull(key: string): WhereCallback {
        this.controller.add('whereNull', [key]);
        return this;
    }

    public whereNotNull(key: string): WhereCallback {
        this.controller.add('whereNotNull', [key]);
        return this;
    }

    //todo callback
    public whereHas(key: string | string[], callback?: any): WhereCallback {
        console.log(key);
        console.log(this.key);
        if (Array.isArray(key)) {
            for (let k of key) {
                this.controller.add('whereHas', [{origin: this.key ,relation: k}]);
            }
        } else {
            this.controller
                .add('whereHas', [{origin: this.key ,relation: key, callback: callback}]);
        }
        return this;
    }

    public whereNotHas(key: string | string[]): WhereCallback {
        if (!Array.isArray(key)) {
            this.controller.add('whereNotHas', [{origin: this.key ,relation: key}]);
        } else {
            for (let k of key) {
                this.controller.add('whereNotHas', [{origin: this.key ,relation: k}]);
            }
        }

        return this;
    }
}