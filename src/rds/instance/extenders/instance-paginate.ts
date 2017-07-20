import {Instance} from "../instance";
import {Observable} from "rxjs";
export class InstancePaginate {

    private instance: Instance;

    constructor(instance: Instance) {
        this.instance = instance;
    }

    public page(page: number): Observable<any> | any {
        return this.instance.page(page);
    }
}