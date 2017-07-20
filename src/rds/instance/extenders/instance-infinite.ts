import {Instance} from "../instance";
export class InstanceInfinite {

    private instance: Instance;
    constructor(instance: Instance) {
        this.instance = instance;
    }

    public until(until: number) {
        return this.instance.until(until);
    }
}