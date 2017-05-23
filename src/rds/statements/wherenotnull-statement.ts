export class WhereNotNullStatement {

    private key;

    constructor(key) {
        this.key = key;
    }

    public check(o: any): boolean {
        return (o[this.key] !== null && o[this.key] !== undefined)
    }
}