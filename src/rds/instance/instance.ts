import {Observable} from "rxjs";
import {InstanceInterface} from "./instance.interface";
import {InstanceDataController} from "./data/instance-data-controller";
import {InstancePaginate} from "./extenders/instance-paginate";
import {InstanceInfinite} from "./extenders/instance-infinite";

export class Instance implements InstanceInterface {

    private data: InstanceDataController;

    constructor(name: string) {
        this.data = new InstanceDataController(name);
    }

    /*************************** retrieving ***************************
     ******************************************************************/

    public find(id: number, obs: boolean = true): Observable<any> | any {
        this.data.setIds(id);
        this.data.setObserver(obs);
        return this.data.find();
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

    public get(ids: number | number[] | boolean = null, obs: boolean = true): Observable<any> | any {
        if (typeof(ids) === "boolean") {
            obs = ids;
            ids = null;
        }
        this.data.setIds(ids);
        this.data.setObserver(obs);
        return this.data.get();
    }

    public getIds(obs: boolean = true): Observable<any> | any {
        this.data.setObserver(obs);
        return this.data.getIds();
    }

    public count(obs: boolean = true): Observable<any> | any {
        this.data.setObserver(obs);
        return this.data.count();
    }

    public paginate(amount: number, page: number, obs: boolean = true): Observable<any> | any {
        this.data.setObserver(obs);
        this.data.data.amount = amount;
        this.data.paginate(page);
    }

    public infinite(amount: number, until: number , obs: boolean = true): Observable<any> | any  {
        this.data.setObserver(obs);
        this.data.data.until = until;
        this.data.infinite(until);
    }

    /*************************** extenders ***************************
     ******************************************************************/


    public paginateBy(amount: number, obs: boolean = true): InstancePaginate {
        this.data.setObserver(obs);
        this.data.data.amount = amount;
        return new InstancePaginate(this);
    }

    public infiniteBy(amount: number, obs: boolean = true): InstanceInfinite {
        this.data.setObserver(obs);
        this.data.data.amount = amount;
        return new InstanceInfinite(this);
    }

    /** the return of the extenders*/

    public page(page: number): Observable<any> | any {
       return this.data.paginate(page);
    }

    public until(until: number): Observable<any> | any{
        return this.data.infinite(until);
    }


    /*************************** statements ***************************
     ******************************************************************/

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

    public whereHas(key: string | string[], callback?: any): Instance {
        if (!Array.isArray(key)) {
            this.data.addWhereStatement('whereHas', [{origin: this.data.key, relation: key, callback: callback}]);
        } else {
            if (callback) {
                //todo throw big error now allowed with array
            }
            for (let s of key) {
                this.data.addWhereStatement('whereHas', [{origin: this.data.key, relation: s, callback: callback}]);
            }
        }
        return this;
    }

    public whereNotHas(key: string | string[]): Instance {
        if (!Array.isArray(key)) {
            this.data.addWhereStatement('whereNotHas', [{origin: this.data.key, relation: key}]);
        } else {
            for (let s of key) {
                this.data.addWhereStatement('whereNotHas', [{origin: this.data.key, relation: s}]);
            }
        }
        return this;
    }

    /*************************** joins ***************************
     ******************************************************************/

    public join(key: string | string[], callback: any = null): Instance {

        if (Array.isArray(key)) {
            for (let s of key) {
                this.data.addJoinStatement(s);
            }
        } else if (callback !== null) {
            this.data.addJoinStatement(key, callback);
        } else {
            this.data.addJoinStatement(key);
        }

        return this;
    }

    /*************************** orderBy ***************************
     ******************************************************************/

    public orderBy(key: string | any[], order?: string): Instance { //todo make type
        if (order) {
            this.data.addOrderByStatement({key: key, order: order});
        } else {
            for (let i = 0; i < key.length; i++) {
                let s = key[i];
                this.data.addOrderByStatement({key: s[0], order: s[1]})
            }
        }
        return this;
    }

    /*************************** direct actions ***************************
     ******************************************************************/

    public update(data: any): void {
        this.data.update(data);
    }

    public remove(): void {
        this.data.remove();
    }
}