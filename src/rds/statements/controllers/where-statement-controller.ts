import {WhereStatementPocket} from "./where-statement-pocket";
import {WhereCallback} from "./where-callback";

export class WhereStatementController {

    public key: string;

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

    public has(key?: string): boolean {
        //checks if there is a where function
        if (!key) {
            for (let pocket of this.pockets) {
                if (pocket.has()) return true;
            }
            return false;
        }
        //checks if there is a key
        for (let pocket of this.pockets) {
            if (pocket.has()) return true;
        }
        return false;

    }

    public hasWhereHas(): boolean {
        for (let pocket of this.pockets) {
            if (pocket.hasWhereHas()) return true;
        }
        return false;
    }

    public hasWhereNotHas(): boolean {
        for (let pocket of this.pockets) {
            if (pocket.hasWhereNotHas()) return true;
        }
        return false;
    }


    public filter(data: any[]): any[] {
        return data.filter((obj: any) => this.check(obj))
    }

    public check(data: any): boolean {
        for (let s of this.pockets) {
            if (s.check(data)) return true;
        }
        return false
    }

    public checkWhereHas(data: any): boolean {
        for (let s of this.pockets) {
            if (s.checkWhereHas(data)) return true;
        }
        return false
    }

    public checkWhereNotHas(data: any): boolean {
        for (let s of this.pockets) {
            if (s.checkWhereNotHas(data)) return true;
        }
        return false
    }

    public getWhereHasKeys(): string[] {
        let array: string[] = [];

        for (let p of this.pockets) {
            let result: string[] = p.getWhereHasKeys();
            for (let r of result) {
                array.push(r);
            }
        }

        return array;
    }

    public getWhereNotHasKeys(): string[] {
        let array: string[] = [];

        for (let p of this.pockets) {
            let result: string[] = p.getWhereNotHasKeys();
            for (let r of result) {
                array.push(r);
            }
        }

        return array;
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