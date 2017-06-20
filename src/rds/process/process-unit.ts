import {Collector} from "../collector/collector";

export class ProcessUnit {

    public collector: Collector;

    public data: any[];

    constructor(collector: Collector, data: any[]) {
        this.collector = collector.copy();
        this.data = data.slice();
    }

    public setData(data: any[]): void {
        if(!data) return;
        this.data = data;
    }

}
