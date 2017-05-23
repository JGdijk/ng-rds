import {WhereStatementPocket} from "./where-statement-pocket";
import {WhereCallback} from "./where-callback";

export class WhereStatementController {

    private key: string;

    private pockets: WhereStatementPocket[] = [];

    constructor(key: string) {
        this.key = key;
        this.addPocket();
    }

    public add(type: string, statements: any[]): void { //todo statements type
        // if there is a callback
        if (typeof statements === "function") {
            this.addCallback(type, statements);
            return;
        }

        // if there is a or function
        if ((type) === 'orWhere') {
            this.addOrWhere(statements);
            return;
        }

        // if normal statements
        for (let s of statements) {
            this.pockets[0].add(type, s);
        }
    }

    public has(): boolean { //todo this can be extended when add more where functionality
        return (this.pockets.length > 0);
    }

    public filter(data: any[]): any[] { //todo this can be devided into multiple functions when extended
        return data.filter((obj) => {
            for (let pocket of this.pockets) {
                if (pocket.check(obj)) return true;
            }
            return false
        })
    }

    public check(data: any): boolean {
        for (let s of this.pockets) {
            if (!s.check(data)) return false;
        }
        return true;
    }

    /*************************** callbacks ***************************
     ******************************************************************/

    private addCallback(type: string, callback: any) {
        switch (type) {
            case 'where':
                this.addWhereCallback(callback);
                break;
            case 'orWhere':
                this.addOrWhereCallback(callback);
                break;
            default: // todo throw error;
        }
    }

    private addWhereCallback(callback: any): void {
        new WhereCallback(this.pockets[0], callback, this.key);
    }

    private addOrWhereCallback(callback: any): void {
        let pocket = this.addPocket();
        new WhereCallback(pocket, callback, this.key);
    }


    /*************************** Or ***************************
     ******************************************************************/

    private addOrWhere(statements: any): void {
        let pocket = this.addPocket();
        for (let s of statements) {
            pocket.add('where', s);
        }
    }

    /*************************** helper functions ***************************
     ******************************************************************/

    private addPocket(): WhereStatementPocket {
        let key = this.pockets.length;
        this.pockets[key] = new WhereStatementPocket();
        return this.pockets[key];
    }
}