import {OrderByStatement} from "../orderby-statement";

export class OrderByStatementController {

    private orderByStatements: OrderByStatement[] = [];

    constructor(){}

    public add(statement: any): void {
        this.orderByStatements.push(new OrderByStatement(statement));
    }

    public has(): boolean {
        return (this.orderByStatements.length > 0);
    }

    public init(data: any[]): any[] { //todo change this name
        for (let s of this.orderByStatements) {
            data = s.order(data);
        }
        return data;
    }
}