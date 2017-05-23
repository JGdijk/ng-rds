export class WhereNotInStatement {

    private statement;

    constructor(statement) {
        this.statement = statement;
    }

    public check(o: any): boolean {
        for (let v of this.statement.values) {
            if (o[this.statement.key] === v) return false;
        }
        return true;
    }
}