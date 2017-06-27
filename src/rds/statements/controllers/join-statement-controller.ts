import {JoinStatement} from "../join-statement";
import {JoinCallback} from "./join-callback";

export class JoinStatementController {

    private joinStatements: JoinStatement[] = [];

    public origin: string;

    constructor(origin: string) {
        this.origin = origin;
    }

    public get(): JoinStatement[] {
        return this.joinStatements;
    }

    public add(statements: string | string[], callback: any): void {
        if (Array.isArray(statements)) {
            for (let s of statements) {
                this.addStatement(s);
            }
        } else {
            this.addStatement(statements, callback)
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

    private addStatement(statement: any, callback: any = null): void {

        //if the statement is a callback process it directly
        if (callback !== null) {
            this.joinStatements.push(new JoinStatement(statement, this.origin, callback));
            return;
        }

        //if not then we have to check if it is a chained nested relation e.g. 'project.tasks.users'
        let statements: string[] = statement.split(".");
        let s: string = statements[0];

        // if the array has more than 1 element the statement indeed contains nested relations
        if (statements.length > 1) {
            let otherStatements: string = statements.slice(1).join(".");
            let callback = (jc: JoinCallback) => {
                jc.join(otherStatements)
            };
            this.joinStatements.push(new JoinStatement(s, this.origin, callback));
            return;
        }
        this.joinStatements.push(new JoinStatement(s, this.origin));
    }
}