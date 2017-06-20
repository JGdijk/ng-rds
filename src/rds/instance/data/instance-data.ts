import {WhereStatementController} from "../../statements/controllers/where-statement-controller";
import {JoinStatementController} from "../../statements/controllers/join-statement-controller";
import {OrderByStatementController} from "../../statements/controllers/orderby-statement-controller";
import {vault} from "../../vault/vault";
import {InstanceDataPusherInterface} from "./instance-data-pusher.interface";

export class InstanceData implements InstanceDataPusherInterface{

    public data: any[] = [];

    public ids: number[];

    /** this is the name of the instance*/
    public key: string;

    public isInitiated: boolean = false;

    /** all the statements */
    public whereStatementController: WhereStatementController;
    public joinStatementController: JoinStatementController;
    public orderByStatementController: OrderByStatementController;

    constructor(key: string) {
        this.key = key;

        this.whereStatementController = new WhereStatementController(this.key);
        this.joinStatementController = new JoinStatementController(this.key);
        this.orderByStatementController = new OrderByStatementController();
    }

    public setIds(ids: number | number[] = null): void {
        if(!ids) return;

        if (!Array.isArray(ids)) {
            let array = [];
            array.push(ids);
            ids = array;
        }
        this.ids = ids;
    }

    public get(): any[] {
        if (this.isInitiated) return this.data;

        this.init();
        return this.data;
    }

    /*************************** actions ***************************
     ******************************************************************/




    public update(data: any): void {
        //todo maybe later directly from map instead of create a new array?
        //todo we might want to have a wild card '*' if there is no where so everything will be updated?

        let objects: any[] = this.fetchFromStore();

        objects = this.whereStatementController.filter(objects);

        let primaryKey = vault.get(this.key).primaryKey;
        let ids: number[] = [];
        for (let obj of objects) {
            ids.push(obj[primaryKey]);
        }

        vault.update(this.key, ids, data);
    }

    public remove(): void {
        //todo maybe later directly from map instead of create a new array?

        let objects: any[] = this.fetchFromStore();

        objects = this.whereStatementController.filter(objects);

        let primaryKey = vault.get(this.key).primaryKey;
        let ids: number[] = [];
        for (let obj of objects) {
            ids.push(obj[primaryKey]);
        }

        vault.remove(this.key, ids);
    }


    /*************************** manipulating the data ***************************
     ******************************************************************/

    public push(instance: any): void {
        this.data.push(instance);
    }

    public replace(key: any, instance: any): void { //todo fix key type
        this.data.splice(key,1);
        this.data.push(instance);
    }

    /*************************** helper function ***************************
     ******************************************************************/

    public hasKey(key?: string): boolean {
        //todo has to add whereHas statements
        if (key === this.key) return true;
        return (this.joinStatementController.has(key));
    }

    public hasIds(): boolean {
       return !!(this.ids);
    }


    /*************************** private functions ***************************
     ******************************************************************/

    private init(): void {
        let data = this.fetchFromStore();

        if (this.whereStatementController.has()) {
            data = this.whereStatementController.filter(data);
        }

        data = this.makeInstances(data);

        if (this.joinStatementController.has()) {
            data = this.joinStatementController.attach(data)
        }

        this.data = data;

        this.order();

        this.isInitiated = true;

        //todo in case of find() first() and limit we need to adjust the saving;
        //todo can we make instances after ordering?
    }

    public order() {
        this.data = this.orderByStatementController.init(this.data);
    }


    public fetchFromStore(): any[] {
        return vault.get(this.key).data.get(this.ids);
    }

    private makeInstances(data): any[] {

        let model: any = vault.get(this.key).model;
        let returnData: any[] = [];

        for (let obj of data) {
            returnData.push(new model(obj))
        }
        return returnData;
    }

}