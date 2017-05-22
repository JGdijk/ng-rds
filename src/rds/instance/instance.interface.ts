import {Observable} from "rxjs";
import {Instance} from "./instance";

export interface InstanceInterface {
    find(id: number, obs: boolean): Observable<any> | any;
    get(ids: number | number[] | boolean, obs: boolean): any[] | Observable<any[]>
    first(ids: number | number[] | boolean, obs: boolean): Observable<any> | any;
    where(key: string | any[], action?: string, value?: string|number): Instance
    join(key: string | string[]): Instance
    orderBy(key: string | any[], order: string): Instance
    update(data: any): void
    remove(): void
}