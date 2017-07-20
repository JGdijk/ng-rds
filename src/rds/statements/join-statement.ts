import {RelationWithObject, VaultObject} from "../vault/vault-object";
import {vault} from "../vault/vault";
import {JoinCallback} from "./controllers/join-callback";
import {WhereStatementController} from "./controllers/where-statement-controller";
import {OrderByStatementController} from "./controllers/orderby-statement-controller";
import {JoinStatementController} from "./controllers/join-statement-controller";
import {InstanceDataPusherInterface} from "../instance/data/instance-data-pusher.interface";

export class JoinStatement implements InstanceDataPusherInterface {

    public key: string;

    public origin: string;

    private complicated: boolean = false;

    public whereStatementController: WhereStatementController;
    public orderByStatementController: OrderByStatementController;
    public joinStatementController: JoinStatementController;

    constructor(statement: any, origin: string, callback: any = null) {
        this.origin = origin;
        this.setKey(statement);

        if (callback !== null) {
            this.complicated = true;
            this.addCallback(callback);
        }
    }

    public setKey(key: string): void { //todo what we return if relation doesn't exists
        this.key = vault.get(this.origin).relations.relationName(key);
        this.whereStatementController = new WhereStatementController(this.key);
        this.orderByStatementController = new OrderByStatementController();
        this.joinStatementController = new JoinStatementController(this.key);
    }

    public has(key?: string ): boolean {
        if (key) {
            if (this.key === key) return true;
            return (this.joinStatementController.has(key));
        } else {
            return this.joinStatementController.has();
        }

    }

    public objectKey(): string {
        return vault.get(this.origin).relations.use(this.key).objectKey;
    }

    public returnArray(): boolean {
        return vault.get(this.origin).relations.use(this.key).returnArray;
    }

    public attach(origin: string, data: any): any {

        // for each object
        if(Array.isArray(data)) {
            for (let m of data) {
               m = this.attachToObject(origin, m);
            }
        } else {
            data = this.attachToObject(origin, data);
        }

        return data;
    }

    private attachToObject(origin: string, obj: any): any {

        let vaultObject: VaultObject = vault.get(origin);

        let relation: RelationWithObject = vaultObject.getRelations(this.key, obj[vaultObject.primaryKey]);

        let data: any = relation.data;

        // if it's empty or null we can return
        if (!data || data.length === 0) {
            obj[relation.name] = data;
            return obj;
        }

        if (!this.complicated) {
            obj[relation.name] = data;
            return obj;
        }

        let isArray = vaultObject.relations.use(this.key).returnArray;

        // checks if we get an array or single object
        if (!isArray) {
            data = (this.whereStatementController.check(data) ? data : null)
        } else {
            data = this.whereStatementController.filter(data);
        }

        if (!data || data.length === 0) {
            obj[relation.name] = data;
            return obj;
        }
        // join nested relations if exists
        this.joinStatementController.attach(data);

        // order
        if (isArray) {
            data = this.orderByStatementController.init(data)
        }

        obj[relation.name] = data;
        return obj;
    }

    private addCallback(callback: any): void {
        new JoinCallback(this, callback);
    }
}