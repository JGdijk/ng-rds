import {vault} from "../../vault/vault";
type AddCollectorData = {
    [key: string]: any[]
}

export class AddCollector {

    private data: AddCollectorData = {};


    public get(target: string, ids: number[]): any[] {
        let array: any[] = [];

        let primaryKey: string = vault.get(target).primaryKey;

        // if the id matches one of the relation we push
        idLoop: for (let id of ids) {
            for (let obj of this.data[target]) {
                if (obj[primaryKey] !== id ) continue;

                // we want to make a new object of it so it will not be referenced into multiple places
                array.push(Object.assign({},obj));
                continue idLoop;
            }
        }

        return array;
    }

    public has(key: string): boolean {
        return this.data.hasOwnProperty(key);
    }

    public add(key: string, object:any): void {
        if(!this.data[key]) this.data[key] = [];
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
        return this.data[key].slice();
    }


}