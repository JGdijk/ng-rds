import {vault} from "../../../vault/vault";
import {ProcessUnit} from "../../../process/process-unit";
import {JoinStatement} from "../../../statements/join-statement";
import {InstanceDataPush} from "./instance-data-push";

export class InstanceDataRemover extends InstanceDataPush{

    protected type: string = 'remove';

    public run(processUnit: ProcessUnit): any[] {

        //if non of the added keys matches the instance's return false
        if (!this.checkKeys(processUnit.collector)) return;

        //set the collector
        this.init(processUnit);

        //checks if any of the main data needs to be added directly
        this.processTarget();

        //checks if any data changes according to any relation connected to this instance;
        this.processRelations();

        return this.newData;
    }

    private processTarget(): void {
        let key = this.data.key;

        // if the collector doesn't contain any parent data we can move on
        if (!this.typeCollector.has(key)) return;

        let ids = this.typeCollector.copy(key);

        // check if it matches any id's
        if (this.data.hasIds()) {
            ids = this.filterIds(ids);
        }

        let primaryKey = vault.get(key).primaryKey;

        let array: any[] = this.newData.filter(obj => {
            for (let id of ids) {
                if (id === obj[primaryKey]) {
                    this.collector.setChecked();
                    return false;
                }
            }
            return true;
        });

        this.newData = this.orderArray(this.data, array);
    }

    /**
     * if the relation needs to be deleted we return null (in an object because null means no changes)
     * if any of the nested relation has changed we return a new object
     */
    protected checkRelationStatementObject(statement: JoinStatement, dataObject: any): any {

        let relation: any = dataObject[statement.objectKey()];

        if (!relation) return;

        let primaryKey: string = vault.get(statement.key).primaryKey;

        //checks if the relation object needs to be deleted
        if (this.typeCollector.check(statement.key, relation[primaryKey])) return {data: null}; //todo not nice

        // will delete any nested object if needed
        let result: any = this.checkRelationData(statement, relation);

        if (result) return {data: result}; //todo not nice
    }

    /**
     * will make a new array and returns it if any of the relation (or nested) data is deleted
     */
    protected checkRelationStatementArray(statement: JoinStatement, dataObject: any): any {

        let check: boolean;
        let array: any[] = [];
        let primaryKey: string = vault.get(statement.key).primaryKey;

        //checks every relation
        for (let relation of dataObject[statement.objectKey()]) {

            //if the relation needs to be removed, simply don't push it to the new array
            if (this.typeCollector.check(statement.key, relation[primaryKey])) {
                check = true;
                continue;
            }

            //checks if any of the nested relation needs to be deleted
            let result = this.checkRelationData(statement, dataObject[statement.objectKey()]);

            // if any of the nested relations was deleted push the new relations, else push the old
            if (result) {
                check = true;
                array.push(result)
            } else {
                array.push(relation);
            }
        }

        //if any of the data has been altered, return the newly made array
        if (check) return {data: this.orderArray(statement, array)};
    }


    /*************************** Helper function ***************************
     ******************************************************************/

    private filterIds(ids: number[]): any[] {
        return ids.filter((id: number) => {
            for (let dataId of this.data.ids) {
                if (id === dataId) return true;
            }
            return false;
        })
    }
}