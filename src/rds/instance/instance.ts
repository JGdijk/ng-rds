import {Observable} from "rxjs";

import {InstanceInterface} from "./instance.interface";
import {InstanceDataController} from "./data/instance-data-controller";



export class Instance implements InstanceInterface {

    private data: InstanceDataController;

    constructor(name: string) {
        this.data = new InstanceDataController(name);
    }

    public find(id: number, obs: boolean = true): Observable<any> | any {
        this.data.setIds(id);
        this.data.setObserver(obs);
        return this.data.find();
    }

    public get(ids: number | number[] | boolean = null, obs: boolean = true): Observable<any> | any {
        if (typeof(ids) === "boolean") {
            obs = ids;
            ids = null;
        }
        this.data.setIds(ids);
        this.data.setObserver(obs);
        return this.data.get();
    }

    public first(ids: number | number[] | boolean = 0, obs: boolean = true): Observable<any> | any {
        if (typeof(ids) === "boolean") {
            obs = ids;
            ids = 0;
        }
        this.data.setIds(ids);
        this.data.setObserver(obs);
        return this.data.first();
    }

    public where(key: string | any[], action?: string, value?: string | number): Instance { //todo make type for any[]
        if (action) {
            this.data.addWhereStatement('where', {key: key, action: action, value: value});
        } else {
            for (let i = 0; i < key.length; i ++) {
                let s = key[i];
                this.data.addWhereStatement('where', {key: s[0], action: s[1], value: s[2]});
            }
        }
        return this;
    }

    public join(key: string | string[]): Instance {
        if (!Array.isArray(key)) {
            this.data.addJoinStatement('with', key);
        } else {
            for (let s of key) {
                this.data.addJoinStatement('with', s);
            }
        }
        return this;
    }

    public orderBy(key: string | any[], order?: string): Instance { //todo make type
        if (order) {
            this.data.addOrderByStatement({key: key, order: order});
        } else {
            for (let i = 0; i < key.length; i ++) {
                let s = key[i];
                this.data.addOrderByStatement({key: s[0], order: s[1]})
            }
        }
        return this;
    }

    public update(data: any): void {
        this.data.update(data);
    }

    public remove(): void {
        this.data.remove();
    }
}