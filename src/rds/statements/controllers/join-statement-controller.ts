import {JoinStatement} from "../join-statement";

export class JoinStatementController {

    private joinStatements: JoinStatement[] = [];

    private origin: string;

    constructor(origin: string) {
        this.origin = origin;
    }

    public add(type: string, statement: any): void {
        switch(type) {
            case 'with':
                this.joinStatements.push(new JoinStatement(statement, this.origin));
                break;
        }
    }

    public has(key?: string): boolean {
        if (!key) return (this.joinStatements.length > 0);

        for (let s of this.joinStatements) {
            if (s.has(key)) return true;
        }

        return false;
    }

    public attach(data: any): any {
        for (let s of this.joinStatements) {
            data = s.attach(this.origin, data);
        }
        return data;
    }

    public objectKeys(): string[] {
        let array = [];
        for (let s of this.joinStatements) {
            array.push(s.objectKey());
        }
        return array;
    }
}