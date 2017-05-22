import {Observable} from "rxjs";
import {InstanceData} from "./instance-data";
import {InstanceDataAdder} from "./push/instance-data-adder";
import {InstanceDataUpdater} from "./push/instance-data-updater";
import {InstanceDataRemover} from "./push/instance-data-remover";
import {InstanceDataAttacher} from "./push/instance-data-attacher";
import {InstanceDataDetacher} from "./push/instance-data-detacher";
import {Collector, CollectorDataObject} from "../../collector/collector";
import {vault} from "../../vault/vault";

export class InstanceDataController {

    private data: InstanceData;

    /** add, update and remove classes */
    private adder: InstanceDataAdder;
    private updater: InstanceDataUpdater;
    private remover: InstanceDataRemover;
    private attacher: InstanceDataAttacher;
    private detacher: InstanceDataDetacher;

    private observer: boolean;

    constructor(key: string) {
        this.data = new InstanceData(key);

        this.adder = new InstanceDataAdder(this.data);
        this.updater = new InstanceDataUpdater(this.data);
        this.remover = new InstanceDataRemover(this.data);
        this.attacher = new InstanceDataAttacher(this.data);
        this.detacher = new InstanceDataDetacher(this.data);
    }

    /*************************** actions ***************************
     ******************************************************************/

    public find(): Observable<any> | any {
        if (!this.observer) {
            return this.data.get()[0];
        } else {
            return this.broadcaster()
                .startWith(null)
                .filter((collector: Collector) => {
                    return (!collector)
                        ? true
                        : this.push(collector)
                })
                .map(() => this.data.get()[0]);
        }
    }

    public get(): Observable<any> | any {
        if (!this.observer) {
            return this.data.get();
        } else {
            return this.broadcaster()
                .startWith(null)
                .filter((collector: Collector) => {
                    return (!collector)
                        ? true
                        : this.push(collector)
                })
                .map(() => this.data.get());
        }
    }

    public first(): Observable<any> | any {
        if (!this.observer) {
            return this.data.get()[0];
        } else {
            return this.broadcaster()
                .startWith(null)
                .filter((collector: Collector) => {
                    return (!collector)
                        ? true
                        : this.push(collector)
                })
                .map(() => this.data.get()[0]);
        }
    }

    public update(data: any): void {
        this.data.update(data);
    }

    public remove(): void {
        this.data.remove();
    }


    /*************************** add statements ***************************
     ******************************************************************/

    public addWhereStatement(type: string, statement: any): void {
        this.data.whereStatementCollector.add(type, statement);
    }

    public addJoinStatement(type: string, statement: any): void {
        this.data.joinStatementCollector.add(type, statement);
    }

    public addOrderByStatement(statement: any): void {
        this.data.orderByStatementCollector.add(statement);
    }

    /*************************** checkers ***************************
     ******************************************************************/

    private push(collector: Collector): boolean {
        let data: CollectorDataObject = Object.assign({}, collector.get());

        switch (collector.type) {
            case 'add':
                return this.addCheck(data);
            case 'update':
                return this.updateCheck(data);
            case 'remove':
                return this.removeCheck(data);
            case 'attach':
                return this.attachCheck(data);
            case 'detach':
                return this.detachCheck(data);
            default:
                return false; // todo throw error type has not be identified (should not be possible)
        }
    }

    private addCheck(data: CollectorDataObject): boolean {
        return this.adder.run(data);
    }

    private updateCheck(data: CollectorDataObject): boolean {
        return this.updater.run(data);
    }

    private removeCheck(data: CollectorDataObject): boolean {
        return this.remover.run(data);
    }

    private attachCheck(data: CollectorDataObject): boolean {
        if (!this.data.joinStatementCollector.has) return false;
        return this.attacher.run(data);
    }

    private detachCheck(data: CollectorDataObject): boolean {
        if (!this.data.joinStatementCollector.has) return false;
        return this.detacher.run(data);
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