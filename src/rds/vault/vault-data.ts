export class VaultData {

    private primaryKey: string;

    public data: Map<number, string> = new Map();

    public constructor(primaryKey: string) {
        this.primaryKey = (primaryKey) ? primaryKey : 'id';
    }

    public find(id: number) : any {
        return this.data.get(id);
    }

    public get(ids: number[] = null): any[] {
        if (!ids) {
            return Array.from(this.data.values());
        } else {
            let array: any[] = [];
            for( let id of ids) {
                array.push(this.data.get(id));
            }
            return array;
        }
    }

    public add(obj: any): void {
        this.data.set(obj[this.primaryKey], obj);
    }

    public update(id: number, data: any): void {
        let obj = this.find(id);
        for (let key in data) {
            obj[key] = data[key];
        }
    }

    public remove(id: number): void {
        this.data.delete(id);
    }




}