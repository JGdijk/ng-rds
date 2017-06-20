type AttachCollectorData = {
    [key: string]: {
        [key: string]: {
            [key: string]: number[]
        }
    }
}

export class AttachCollector {

    private data: AttachCollectorData = {};

    public has(key: string): boolean {
        return this.data.hasOwnProperty(key);
    }

        public add(key: string, target: string, targetId: number, ids: number | number[]): void {
        ids = (Array.isArray(ids)) ? ids : [ids];

        this.initTarget(key, target, targetId);

        for (let id of ids) {
            this.data[key][targetId][target].push(id);
        }
    }

    private initTarget(key: string, target: string, targetId: number): void {
        if(!this.data.hasOwnProperty(key)) this.data[key] = {};
        if(!this.data[key].hasOwnProperty(targetId)) this.data[key][targetId] = {};
        if(!this.data[key][targetId][target]) this.data[key][targetId][target] = [];
    }

    public get(target: string, targetId: number = null, relation: string = null): any {
        //checks if it contains te target
        if (!this.has(target)) return;

        // if no targetId has been given
        if (!targetId) return this.data[target];

        //checks if it contains the target id
        if (!this.data[target].hasOwnProperty(targetId)) return;

        // if no relation is specified we will return all results
        if (!relation) return this.data[target][targetId];

        // checks if the the target contains the relation
        if (!this.data[target][targetId].hasOwnProperty(relation)) return;

        return this.data[target][targetId][relation];
    }

    public getTargetIds(target: string, relations: string[]): number[] {

        //checks if it contains te target
        if (!this.has(target)) return;

        let array: number[] = [];

        let results: any = this.get(target);

        for (let i in results) {
            if (!results.hasOwnProperty(i)) continue;

            if (!this.objectContainsKey(results[i], relations)) continue;

            array.push(parseInt(i));
        }

        return array;
    }

    private objectContainsKey(object: any, keys: string[]): boolean {
        for(let key of keys) {
            if (object.hasOwnProperty(key.toString())) return true;
        }
        return false;
    }

    public keys(): string[] {
        let array: string[] = [];
        for (let key in this.data) {
            array.push(key);
        }
        return array;
    }

}