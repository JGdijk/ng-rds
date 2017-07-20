import {Collector} from "../collector/collector";

export class ProcessUnit {

    public collector: Collector;

    public data: any[];

    public backUp: any[];

    constructor(collector: Collector, data: any[]) {
        this.collector = collector.copy();
        this.data = data.slice();
    }

    public setData(data: any[]): void {
        if(!data) return;
        this.data = data;
    }

    public setBackup(data: any[], primaryKey: string): void {
        let newIds: any = data.map((obj: any) => obj[primaryKey]);
        let dataIds: any = this.data.map((obj: any) => obj[primaryKey]);

        this.data = this.data.filter((obj: any) => {
            for (let id of newIds) {
                if (obj[primaryKey] === id) return true;
            }
            this.collector.setChecked();
            return false;
        });

        this.backUp = data.filter((obj: any) => {
            for (let id of dataIds) {
                if (obj[primaryKey] === id ) return false;
            }
            return true;
        });
    }

}
