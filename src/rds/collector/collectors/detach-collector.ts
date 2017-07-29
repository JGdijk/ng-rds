type DetachCollectorData = {
    [key: string]: {
        [key:number]: {
            [key: string]: number[]
        }
    }
}

export class DetachCollector {

    private data: DetachCollectorData = {};

    public has(key: string): boolean {
        return this.data.hasOwnProperty(key);
    }

    public get(target: string, targetId: number = null, relation: string = null): any {
        //checks if it contains te target
        if (!this.has(target)) return false;

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
            // checks if the objects contains any of the given keys
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


    public check(target: string, targetId: number, relation: string, relationId: number): boolean {

        if (!this.data.hasOwnProperty(target)) return;
        if (!this.data[target].hasOwnProperty(targetId)) return;
        if (!this.data[target][targetId].hasOwnProperty(relation)) return;

        for (let id of this.data[target][targetId][relation]) {
            if (id === relationId) return true;
        }
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

    public keys(): string[] {
        let array: string[] = [];
        for (let key in this.data) {
            array.push(key);
        }
        return array;
    }

}