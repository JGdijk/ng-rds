import {AttachCollector} from "../../../../collector/collectors/attach-collector";
import {DetachCollector} from "../../../../collector/collectors/detach-collector";
import {WhereStatementController} from "../../../../statements/controllers/where-statement-controller";
import {WhereHasStatement} from "../../../../statements/wherehas-statement";
import {WhereNotHasStatement} from "../../../../statements/wherenothas-statement";
import {vault} from "../../../../vault/vault";

export class WhereNotHasCheck {

    private collector: AttachCollector & DetachCollector;

    private statementOrigin: WhereStatementController;

    private ids: number[] = [];

    public run(collector: AttachCollector & DetachCollector,
               statement: WhereStatementController): number[] {
        if (!statement.hasWhereHas()) return;

        this.collector = collector;
        this.statementOrigin = statement;

        this.startProcessStatements();

        return this.ids;
    }

    private startProcessStatements(): void {
        let stream: any = [this.statementOrigin.key];
        this.processStatementController(this.statementOrigin, stream, 0);
    }

    private processStatementController(whereStatementController: WhereStatementController,
                                     stream: string[],
                                     index: number) : void {
        //check whereNotStatements
        let whereNotHasStatements: WhereNotHasStatement[] = whereStatementController.getWhereNotHasStatements();

        let nextIndex: number = index + 1;

        for (let s of whereNotHasStatements) {
            let newStream = this.newStream(stream, s.key);
            this.processNotHasStatement(newStream, nextIndex);
        }

        //check where statements for nested

        let whereStatements: WhereHasStatement[] = whereStatementController.getWhereHasStatements();

        for (let s of whereStatements) {
            let newStream = this.newStream(stream, s.key);
            this.processStatementController(s.whereStatementController, newStream, nextIndex);
        }

    }

    private processNotHasStatement(stream: string[], index): void {
        // get all the effected id's
        let nextIndex: number = index - 1;
        let ids: number[] = this.collector.getTargetIds(stream[index], [stream[nextIndex]]);
        this.processIds(ids, stream, index);
    }

    private processIds(ids, stream, index): void {
        if (!ids || ids.length === 0) return;

        let nextIndex: number = index - 1;
        let relationIds = this.fetchIds(ids, stream[index], stream[nextIndex]);

        if (nextIndex === 0) {
            this.addIds(relationIds);
        } else {
            this.processIds(relationIds, stream, nextIndex);
        }
    }

    /**
     * search for all ids
     */
    private fetchIds(ids, target, relation): number[] {
        let array: number[] = [];

        for (let id of ids) {
            // we get all the ids of the relation connected to the provided id.
            let relationIds = vault.get(target).relations.use(relation).find(id);

            // we filter out all the related ids that are already in the array.
            relationIds = this.filterOut(relationIds, array);

            // we push all the remaining related ids to the collection of ids.
            for (let relationId of relationIds) {
                array.push(relationId);
            }
        }

        return array;
    }


    /**
     * checks if the ids is already in or needs to be added to the return array.
     */
    private addIds(ids: number[]): void {
        if (this.ids.length > 0) {
            ids = this.filterOut(ids, this.ids);
        }
        for (let id of ids) {
            this.ids.push(id);
        }
    }


    /**
     * makes a new array out of the existing stream and adds the next key to it.
     */
    private newStream(stream: any, key: string): any {
        let array: string[] = stream.slice();
        array.push(key);
        return array;
    }

    /**
     * simply filters one array against another.
     */
    private filterOut(newArray: number[], originArray: number[]): number[] {
        return newArray.filter((id: number) => {
            for (let checkId of originArray) {
                if (id === checkId) return false;
            }
            return true;
        })
    }
}

export const whereNotHasCheck = new WhereNotHasCheck();