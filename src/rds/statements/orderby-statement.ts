export class OrderByStatement {

    private statement;

    constructor(statement){
        this.statement = statement;
    }

    public order(data: any[]): any[] {
        let statement = this.statement;

        if (statement.order.toLowerCase() !== 'desc' && statement.order.toLowerCase() !== 'asc') return; // todo trow big error
        let desc = (statement.order.toLowerCase() === 'desc');

        return data.sort((obj1, obj2) => {
            if (Number.isInteger(obj1[statement.key]) && Number.isInteger(obj2[statement.key])) {
                return (desc)
                    ? obj2[statement.key] - obj1[statement.key]
                    : obj1[statement.key] - obj2[statement.key];
            }

            if (Number.isInteger(obj1[statement.key])) return (desc) ? -1 : 1;
            if (Number.isInteger(obj2[statement.key])) return (desc) ? 1 : -1;

            return (desc)
                ? obj2[statement.key].localeCompare(obj1[statement.key])
                : obj1[statement.key].localeCompare(obj2[statement.key]);
        });
    }
}