import {vault} from "../../vault/vault";
type UpdateCollectorData = {
    [key: string]: any[]
}

export class UpdateCollector {

    private data: UpdateCollectorData = {};

    /**
     * return the requested object by key and id.
     */
    public get(target: string, id: number): any {
        let primaryKey: string = vault.get(target).primaryKey;

        for (let i in this.data[target]) {
            let obj: any = this.data[target][i];
            if (obj[primaryKey] === id) return obj;
        }
    }

    public has(key: string): boolean {
        return this.data.hasOwnProperty(key);
    }

    public add(key: string, object:any): void {

        if (!this.data.hasOwnProperty(key)) this.data[key] = [];
        this.data[key].push(object);
    }

    public keys(): string[] {
        let array: string[] = [];
        for (let key in this.data) {
            array.push(key);
        }
        return array;
    }

    public copy(key: string): any[] {
        return this.data[key].splice(0);
    }

}