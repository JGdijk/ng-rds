import {WhereStatementPocket} from "./where-statement-pocket";

export class WhereCallback {

    private key: string;

    private pocket: WhereStatementPocket;

    constructor(pocket: WhereStatementPocket, callback: any, key: string) {
        this.key = key;
        this.pocket = pocket;
        callback(this);
    }

    public where(key: string | any[], action?: string, value?: string | number): WhereCallback {
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

    public whereBetween(key: string, min: number, max: number): WhereCallback {
        this.pocket.add('whereBetween', {key: key, min: min, max: max});
        return this;
    }

    public whereNotBetween(key: string, min: number, max: number): WhereCallback {
        this.pocket.add('whereNotBetween', {key: key, min: min, max: max});
        return this;
    }

    public whereIn(key: string, values: any[]): WhereCallback {
        this.pocket.add('whereIn', {key: key, values: values});
        return this;
    }

    public whereNotIn(key: string, values: any[]): WhereCallback {
        this.pocket.add('whereNotIn', {key: key, values: values});
        return this;
    }

    public whereNull(key: string): WhereCallback {
        this.pocket.add('whereNull', key);
        return this;
    }

    public whereNotNull(key: string): WhereCallback {
        this.pocket.add('whereNotNull', key);
        return this;
    }
    // public whereHas(key: string): WhereCallback {
    //     this.pocket.add('whereHas', {origin: this.key, relation: key});
    //     return this;
    // }
    //
    // public whereNotHas(key: string): WhereCallback {
    //     this.pocket.add('whereNotHas', {origin: this.key, relation: key});
    //     return this;
    // }
}