import {WhereStatementController} from "../../../../statements/controllers/where-statement-controller";
import {AttachCollector} from "../../../../collector/collectors/attach-collector";
import {DetachCollector} from "../../../../collector/collectors/detach-collector";
import {WhereHasStatement} from "../../../../statements/wherehas-statement";
import {vault} from "../../../../vault/vault";

/**
 * this class is solely meant to deal with nested whereHas statements;
 * this class should not be confused with whereHas statement starting in a relation
 */
export class WhereHasCheck {

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

        let statements: WhereHasStatement[] = this.statementOrigin.getWhereHasStatements();

        for (let s of statements) {
            let newStream = this.newStream(stream, s.key);
            this.processStatement(newStream, s, 1);
        }
    }

    private processStatement(stream: string[], statement: WhereHasStatement, index: number): void {
        let ids = this.collector.getTargetIds(statement.key, [statement.origin]);
        this.processIds(ids, stream, index);

        let statements: WhereHasStatement[] = statement.whereStatementController.getWhereHasStatements();
        for (let s of statements) {
            let newStream = this.newStream(stream, s.key);
            this.processStatement(newStream, s, index + 1);
        }
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

export const whereHasCheck = new WhereHasCheck();