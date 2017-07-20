import {Observable} from "rxjs";
import {Instance} from "./instance";
import {InstancePaginate} from "./extenders/instance-paginate";
import {InstanceInfinite} from "./extenders/instance-infinite";

export interface InstanceInterface {

    // retrieving functions
    find(id: number, obs: boolean): Observable<any> | any;
    first(ids: number | number[] | boolean, obs: boolean): Observable<any> | any;
    get(ids: number | number[] | boolean, obs: boolean): any[] | Observable<any[]>
    getIds(obs: boolean): number[] | Observable<number[]>
    count(obs: boolean): number | Observable<number>

    paginate(amount: number, page: number, obs: boolean): Observable<any> | any;
    infinite(amount: number, until: number, obs: boolean): Observable<any> | any;

    paginateBy(amount: number, obs: boolean): InstancePaginate
    infiniteBy(amount: number, obs: boolean): InstanceInfinite

    // where functions + callback
    where(key: string | any | any[], action?: string, value?: string|number): Instance
    orWhere(key: string | any | any[], action?: string, value?: string|number): Instance

    //extra where functions
    whereBetween(key: string, min: number, max: number): Instance
    whereNotBetween(key: string, min: number, max: number): Instance

    whereIn(key: string, values: any[]): Instance
    whereNotIn(key: string, values: any[]): Instance

    whereNull(key: string): Instance
    whereNotNull(key: string): Instance

    whereHas(key: string | string[], callback?: any): Instance
    whereNotHas(key: string | string[], callback?: any): Instance

    join(key: string | string[], callback?: any): Instance

    orderBy(key: string | any[], order: string): Instance

    update(data: any): void
    remove(): void
}