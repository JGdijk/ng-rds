import {Observable} from "rxjs";

import {Instance} from "./instance";
import {InstanceInterface} from "./instance.interface";
import {vault} from "../vault/vault";
import {InstanceRelationAttacher} from "./extenders/instance-relation-attacher";
import {InstanceRelationDetacher} from "./extenders/instance-relation-detacher";


export class InstanceController implements InstanceInterface {

    private name: string;

    constructor(name: string) {
        this.name = name;
    }


    /*************************** getters ***************************
     ******************************************************************/
    public find(id: number, obs: boolean = true): Observable<any> | any {
        return this.getInstance().find(id, obs);
    }

    public get(ids: number | number[] | boolean = null, obs: boolean = true): Observable<any> | any {
        return this.getInstance().get(ids, obs);
    }

    public first(ids: number | number[] | boolean = 0, obs: boolean = true): Observable<any> | any {
        return this.getInstance().first(ids, obs);
    }


    /*************************** statements ***************************
     ******************************************************************/
    public where(key: string | any | any[], action?: string, value?: string|number): Instance {
        return this.getInstance().where(key, action, value);
    }

    public orWhere(key: string | any | any[], action?: string, value?: string|number): Instance {
        return this.getInstance().orWhere(key, action, value);
    }

    public whereBetween(key: string, min: number, max: number): Instance {
        return this.getInstance().whereBetween(key, min, max);
    }

    public whereNotBetween(key: string, min: number, max: number): Instance {
        return this.getInstance().whereNotBetween(key, min, max);
    }

    public whereIn(key: string, values: any[]): Instance {
        return this.getInstance().whereIn(key, values);
    }

    public whereNotIn(key: string, values: any[]): Instance {
        return this.getInstance().whereNotIn(key, values);
    }

    public whereNull(key: string): Instance {
        return this.getInstance().whereNull(key);
    }

    public whereNotNull(key: string): Instance {
        return this.getInstance().whereNotNull(key);
    }

    public whereHas(key: string): Instance {
        return this.getInstance().whereHas(key);
    }

    public whereNotHas(key: string): Instance {
        return this.getInstance().whereNotHas(key);
    }

    public orderBy(key: string | any[], order?: string): Instance { //todo set array type for any[]
        return this.getInstance().orderBy(key, order);
    }

    public join(key: string | string[] | any): Instance {
        return this.getInstance().join(key);
    }

    /*************************** direct vault mutations ***************************
     ******************************************************************/
    public add(objects: any | any[]): void {
        vault.add(this.name, objects);
    }

    public update(data: any): void {
        return this.getInstance().update(data);
    }

    public remove(): void {
        return this.getInstance().remove();
    }


    /*************************** relation mutations ***************************
     ******************************************************************/

    public attach(key: string,
                  relation_ids: number | number[],
                  targetIds:  number | number[] = null): InstanceRelationAttacher{

        if (!targetIds) {
            return new InstanceRelationAttacher(this.name, key, relation_ids);
        } else {
            vault.attach(this.name, targetIds, key, relation_ids);
        }
    }

    public detach(key: string,
                  relationIds: string | number | number[],
                  targetIds:  number | number[] = null): InstanceRelationDetacher {
        if (!targetIds) {
            return new InstanceRelationDetacher(this.name, key, relationIds);
        } else {
            vault.detach(this.name, targetIds, key, relationIds);
        }
    }


    /*************************** helper functions ***************************
     ******************************************************************/
    private getInstance() {
        return new Instance(this.name);
    }

}