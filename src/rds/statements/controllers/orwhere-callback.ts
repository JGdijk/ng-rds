import {WhereStatementPocket} from "./where-statement-pocket";

export class OrWhereCallback {

    private key: string;

    private pocket: WhereStatementPocket;

    constructor(pocket: WhereStatementPocket, callback: any, key: string) {
        this.key = key;
        this.pocket = pocket;
        callback(this);
    }

    public where(key: string | any | any[], action?: string, value?: string | number): OrWhereCallback {

        // one single where statement
        if (action) {
            this.pocket.add('where', {key: key, action: action, value: value});
            return this;
        }

        // array of statements
        for (let i = 0; i < key.length; i ++) {
            let s = key[i];
            this.pocket.add('where', {key: s[0], action: s[1], value: s[2]});
        }

        return this;

    }

    public orWhere(key: string | any | any[], action?: string, value?: string | number): OrWhereCallback {



        return this;
    }

    public whereBetween(key: string, min: number, max: number): OrWhereCallback {
        this.pocket.add('whereBetween', {key: key, min: min, max: max});
        return this;
    }

    public whereNotBetween(key: string, min: number, max: number): OrWhereCallback {
        this.pocket.add('whereNotBetween', {key: key, min: min, max: max});
        return this;
    }

    public whereIn(key: string, values: any[]): OrWhereCallback {
        this.pocket.add('whereIn', {key: key, values: values});
        return this;
    }

    public whereNotIn(key: string, values: any[]): OrWhereCallback {
        this.pocket.add('whereNotIn', {key: key, values: values});
        return this;
    }

    public whereNull(key: string): OrWhereCallback {
        this.pocket.add('whereNull', key);
        return this;
    }

    public whereNotNull(key: string): OrWhereCallback {
        this.pocket.add('whereNotNull', key);
        return this;
    }

    public whereHas(key: string | string[], callback?: any): OrWhereCallback {
        if (!Array.isArray(key)) {
            this.pocket.add('whereHas', {origin: this.key ,relation: key, callback: callback});
        } else {
            if (callback){
                //todo throw big error now allowed with array
            }
            for (let s of key) {
                this.pocket.add('whereHas', {origin: this.key ,relation: s, callback: callback});
            }
        }
        return this;
    }

    public whereNotHas(key: string | string[]): OrWhereCallback {
        if (!Array.isArray(key)) {
            this.pocket.add('whereNotHas', {origin: this.key ,relation: key});
        } else {
            for (let s of key) {
                this.pocket.add('whereNotHas', {origin: this.key ,relation: s});
            }
        }
        return this;
    }
}