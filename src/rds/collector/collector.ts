export type CollectorDataObject = {
    [key: string]: any;
}

export class Collector {
    public data: CollectorDataObject = {};

    public type: string;

    public get(): CollectorDataObject {
        return this.data;
    }

    public add(key: string, object: any): void {
        // if (this.data[key].includes(id)) return; todo check if object is already in?
        if(!this.data[key]) this.data[key] = [];
        this.data[key].push(object);
    }

    public push(key: string, target: string, targetId: number, ids: number | number[]): void {
        ids = (Array.isArray(ids)) ? ids : [ids];

        if(!this.data[key]) this.data[key] = {};
        if(!this.data[key][target]) this.data[key][target] = {};
        if(!this.data[key][target][targetId]) this.data[key][target][targetId] = [];

        //if data is empty we can simply copy the array
        if (this.data[key][target][targetId].length === 0) {
            this.data[key][target][targetId] = ids;
            return;
        }
        //goes over the ids and check if it doesn't contain the id already
        for (let id of ids) {
            if (this.data[key][target][targetId].includes(id)) continue;
            this.data[key][target][targetId].push(id);
        }
    }
}
