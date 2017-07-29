import {WhereStatementController} from "../../statements/controllers/where-statement-controller";
import {JoinStatementController} from "../../statements/controllers/join-statement-controller";
import {OrderByStatementController} from "../../statements/controllers/orderby-statement-controller";
import {vault} from "../../vault/vault";
import {InstanceDataPusherInterface} from "./instance-data-pusher.interface";
import {modelStamps} from "../../model/model-stamps";

export class InstanceData implements InstanceDataPusherInterface {

    public data: any[] = [];

    public ids: number[];

    public primaryOnly: boolean;

    /** this is the name of the instance*/
    public key: string;

    public isInitiated: boolean = false;

    public amount: number;

    public page: number;

    public until: number;

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

    public getIdsOnly(): number[] {
        let array: number[] = [];

        let primaryKey: string = vault.get(this.key).primaryKey;

        for (let obj of this.get()) {
            array.push(obj[primaryKey]);
        }

        return array;
    }

    public setPrimaryOnly(): void {
        this.primaryOnly = true;
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


    /*************************** helper function ***************************
     ******************************************************************/

    public hasKey(key?: string): boolean {
        //todo has to add whereHas statements
        if (key === this.key) return true;
        if (this.whereStatementController.has(key)) return true;
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

        data = this.orderByStatementController.init(data);

        // if there is any form of pagination/infinite we want only a part of the data;
        if (this.amount) data = this.cut(data);

        data = this.makeInstances(data);

        // only if there are relations and if they are required
        if (this.joinStatementController.has() && !this.primaryOnly) {
            data = this.joinStatementController.attach(data)
        }

        this.data = data;

        this.isInitiated = true;

        //todo in case of find() first() and limit we need to adjust the saving;
        //todo can we make instances after ordering?
    }

    public cut(data): any[] {
        let array: any[];

        if (this.page) {
            let start: number = (this.page * this.amount) - this.amount;
            let end: number = this.page * this.amount;
            array = data.slice(start, end);
        } else {
            let start: number = 0;
            let end: number = this.until * this.amount;
            array = data.slice(start, end);
        }

        return array;
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
            let newModel = new model(obj);
            modelStamps.init(newModel);
            returnData.push(newModel)
        }
        return returnData;
    }

}