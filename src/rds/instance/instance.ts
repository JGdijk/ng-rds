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

    public where(key: string | any | any[], action?: string, value?: string | number): Instance {
        //todo make type for any[]
        // one single where statement
        if (action) {
            this.data.addWhereStatement('where', [{key: key, action: action, value: value}]);
        } else { // multiple statements or callback
            this.data.addWhereStatement('where', key)
        }
        return this;

    }

    public orWhere(key: string | any | any[], action?: string, value?: string | number): Instance {
        // one single where statement //todo make type for any[]
        if (action) {
            this.data.addWhereStatement('orWhere', [{key: key, action: action, value: value}]);
        } else { // multiple statements or callback
            this.data.addWhereStatement('orWhere', key)
        }
        return this;

    }

    public whereBetween(key: string, min: number, max: number): Instance {
        this.data.addWhereStatement('whereBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereNotBetween(key: string, min: number, max: number): Instance {
        this.data.addWhereStatement('whereNotBetween', [{key: key, min: min, max: max}]);
        return this;
    }

    public whereIn(key: string, values: any[]): Instance {
        this.data.addWhereStatement('whereIn', [{key: key, values: values}]);
        return this;
    }

    public whereNotIn(key: string, values: any[]): Instance {
        this.data.addWhereStatement('whereNotIn', [{key: key, values: values}]);
        return this;
    }

    public whereNull(key: string): Instance {
        this.data.addWhereStatement('whereNull', [key]);
        return this;
    }

    public whereNotNull(key: string): Instance {
        this.data.addWhereStatement('whereNotNull', [key]);
        return this;
    }

    public whereHas(key: string): Instance {
        this.data.addWhereStatement('whereHas', [{origin: this.data.key ,relation: key}]);
        return this;
    }

    public whereNotHas(key: string): Instance {
        this.data.addWhereStatement('whereNotHas', [{origin: this.data.key ,relation: key}]);
        return this;
    }


    public join(key: string | string[] | any): Instance {
        if (!Array.isArray(key)) {
            this.data.addJoinStatement(key);
        } else {
            for (let s of key) {
                this.data.addJoinStatement(s);
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