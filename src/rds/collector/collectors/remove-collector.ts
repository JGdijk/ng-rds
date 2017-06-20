type RemoveCollectorData = {
    [key: string]: number[]
}

export class RemoveCollector {

    private data: RemoveCollectorData = {};

    public has(key: string): boolean {
        return this.data.hasOwnProperty(key);
    }

    public add(key: string, id: number): void {
        if(!this.data[key]) this.data[key] = [];
        this.data[key].push(id);
    }

    public copy(key: string): any[] {
        return this.data[key].slice();
    }

    public keys(): string[] {
        let array: string[] = [];
        for (let key in this.data) {
            array.push(key);
        }
        return array;
    }

    //checks if it is in the collector
    public check(key: string, id: number): boolean {
        if (!this.data.hasOwnProperty(key)) return false;

        for (let dataId of this.data[key]) {
            if (dataId === id) return true;
        }
    }

}