import {Observable} from "rxjs";
import {InstanceData} from "./instance-data";
import {InstanceDataAdder} from "./push/instance-data-adder";
import {InstanceDataUpdater} from "./push/instance-data-updater";
import {InstanceDataRemover} from "./push/instance-data-remover";
import {InstanceDataAttacher} from "./push/instance-data-attacher";
import {InstanceDataDetacher} from "./push/instance-data-detacher";
import {Collector} from "../../collector/collector";
import {vault} from "../../vault/vault";
import {ProcessUnit} from "../../process/process-unit";

export class InstanceDataController {

    public key: string;

    private data: InstanceData;

    /** add, update and remove classes */
    private adder: InstanceDataAdder;
    private updater: InstanceDataUpdater;
    private remover: InstanceDataRemover;
    private attacher: InstanceDataAttacher;
    private detacher: InstanceDataDetacher;

    private returnType: string;

    private observer: boolean;

    constructor(key: string) {
        this.key = key;
        this.data = new InstanceData(key);

        this.adder = new InstanceDataAdder(this.data);
        this.updater = new InstanceDataUpdater(this.data);
        this.remover = new InstanceDataRemover(this.data);
        this.attacher = new InstanceDataAttacher(this.data);
        this.detacher = new InstanceDataDetacher(this.data);
    }

    /*************************** retrieving ***************************
     ******************************************************************/

    public find(): Observable<any> | any {
        this.returnType = 'find';
        return this.returnResults();
    }

    public first(): Observable<any> | any {
        this.returnType = 'first';
        return this.returnResults();
    }

    public get(): Observable<any> | any {
        this.returnType = 'get';
        return this.returnResults();
    }

    public getIds(): Observable<any> | any {
        this.returnType = 'getIds';
        this.data.setIdsOnly();
        return this.returnResults();
    }

    private returnResults(): Observable<any> | any {
        if (!this.observer) {
            return this.returnData();
        } else {
            return this.broadcaster()
                .startWith(null)
                .filter((collector: Collector) => {
                    return (!collector)
                        ? true
                        : this.push(collector)
                })
                .map(() => this.returnData());
        }
    }

    private returnData(): any | any[] {
        switch(this.returnType) {
            case 'find':
                return this.data.get()[0];
            case 'first':
                return this.data.get()[0];
            case 'get':
                return this.data.get();
            case 'getIds':
                return this.data.getIdsOnly();
        }
    }



    /*************************** writing ***************************
     ******************************************************************/

    public update(data: any): void {
        this.data.update(data);
    }

    public remove(): void {
        this.data.remove();
    }


    /*************************** add statements ***************************
     ******************************************************************/

    public addWhereStatement(type: string, statements: any | any[]): void { //todo statement can be type
        this.data.whereStatementController.add(type, statements);
    }

    public addJoinStatement(statement: string | string[], callback: any = null): void {
        this.data.joinStatementController.add(statement, callback);
    }

    public addOrderByStatement(statement: any): void {
        this.data.orderByStatementController.add(statement);
    }

    /*************************** checkers ***************************
     ******************************************************************/

    private push(collector: Collector): boolean {

        let processUnit = new ProcessUnit(collector, this.data.data);

        // adjust data according to the changed data
        processUnit.setData(this.removeCheck(processUnit));
        processUnit.setData(this.detachCheck(processUnit));
        processUnit.setData(this.updateCheck(processUnit));
        processUnit.setData(this.attachCheck(processUnit));
        processUnit.setData(this.addCheck(processUnit));

        if (processUnit.collector.isChecked()) {
            this.data.data = processUnit.data;
            return true;
        }
    }

    private addCheck(processUnit: ProcessUnit): any[] {
        return this.adder.run(processUnit);
    }

    private updateCheck(processUnit: ProcessUnit): any[] {
        return this.updater.run(processUnit);
    }

    private removeCheck(processUnit: ProcessUnit): any[] {
        return this.remover.run(processUnit);
    }

    private attachCheck(processUnit: ProcessUnit): any[] {
        return this.attacher.run(processUnit);
    }

    private detachCheck(processUnit: ProcessUnit): any[] {
        return this.detacher.run(processUnit);
    }

    /*************************** setters ***************************
     ******************************************************************/

    public setObserver(bool: boolean): void {
        this.observer = bool;
    }

    public setIds(ids: any = null): void {
        if (ids && !Array.isArray(ids)) ids = [ids];
        this.data.setIds(ids);
    }

    /*************************** helper functions ***************************
     ******************************************************************/

    private broadcaster(): Observable<Collector> {
        return vault.broadcasting();
    }

}