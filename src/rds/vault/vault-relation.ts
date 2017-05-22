export type InstantiateRelationObject = {
    name: string,
    origin: string,
    relationPrimaryKey: string,
    originPrimaryKey: string,
}

export type ActivateRelationObject = {
    type: string,
    objectKey: string,
    relationKey: string,
}

export type RelationKey = {
    key: string,
    object: boolean,
    array: boolean,
    name: string,
}

export class VaultRelation {

    /** checks if this relation is dull or not, if it's dull the relation is only used as a mirror to look up
     * the relation in case the target model is added/updated/deleted. the relation cannot be used directly */
    public dull: boolean;

    /** array with ids of the relation*/
    public data: Map<number, number[]>;


    /** name of the relation*/
    public name: string;


    /** name of the origin model*/
    public origin: string;


    /** the type of the relation e.g. hasMany, belongsTo etc*/
    public type: string;


    /** for the next examples we use the case of a project hasMany tasks*/

    /** determine how to simply add + view the relation from the model perspective
     ** tasks || project = {tasks : []} */
    public objectKey: string;

    /** determin how to simply connect multiple relations trough id only
     ** task_ids || project = {task_ids = [1,2,3]}*/
    public relationKey: string;

    /** determin the key on the model
     ** id || project[id] = 1, task = {project_id: 1} */
    public originPrimaryKey: string;

    /** determin the key on the relation
     ** id || project = {task { id: 1 }} */
    public relationPrimaryKey : string;


    /** checks if the relation can have multiple results or just the one hasMany/hasOne */
    public returnArray: boolean;


    /** checks if multiple of the same model can share 1 relation object e.g. 2 tasks have the same label
     ** this information is usable in case we would like to break out an search loop early to increase performance */
    public pivot: boolean;


    constructor(relation: InstantiateRelationObject) {
        this.dull = true;
        this.data = new Map();

        this.name = relation.name;
        this.origin = relation.origin;
        this.originPrimaryKey = relation.originPrimaryKey;
        this.relationPrimaryKey = relation.relationPrimaryKey;

        this.setReturnArray();
        this.setRelationKey();
    }
    public activate(relation: ActivateRelationObject): void {
        this.dull = false;
        this.type = relation.type;

        this.setReturnArray();
        this.setPivot();

        this.setObjectKey(relation.objectKey);
        this.setRelationKey(relation.relationKey);
    }

    public keys(): RelationKey[] {
        if (this.dull) {
            return [
                {key: this.relationKey, object: false, array: this.returnArray, name: this.name}
            ]
        } else {
            return [
                {key: this.objectKey, object: true, array: this.returnArray, name: this.name},
                {key: this.relationKey, object: false, array: this.returnArray, name: this.name}
            ]
        }
    }

    public find(id: number): number[] {
        return this.data.get(id);
    }
    //todo maybe we want to put in just the number instead of array when singel relation
    public add(id: number, relation_ids: number | number[]): void {
        relation_ids = (Array.isArray(relation_ids)) ? relation_ids : [relation_ids];
        //new entry
        if (!this.data.has(id)) {
            this.data.set(id, relation_ids);
        //adding entries
        } else {
            let array = this.data.get(id);
            relation_loop: for(let relation_id of relation_ids) {
                // if (array.includes(relation_id)) continue;
                for (let array_id of array) {
                    if (array_id === relation_id) continue relation_loop;
                }
                array.push(relation_id);
            }
            this.data.set(id, array);
        }
    }

    public remove(id: number): void {
        this.data.delete(id);
    }

    public detach(id: number, relation_ids: number | number[]): void {
        let array = this.find(id);
        let new_array = (!Array.isArray(relation_ids))
            ? array.filter(x => x !== relation_ids)
            // : array.filter(x => !relation_ids.includes(x));
            : array.filter(x => () => {
                    for (let relation_id of relation_ids) {
                        if (relation_id === x) return false;
                    } return true;
                });
        this.data.set(id, new_array);
    }

    public emptyObject() : any {
        return (this.returnArray)
            ? []
            : {}
    }

    private setReturnArray(): void {
        switch (this.type) {
            case 'hasMany':
                this.returnArray = true;
                break;
            case 'belongsTo':
                this.returnArray = false;
                break;
            default:
                return; //todo should trow error
        }
    }
    private setPivot(): void {
        switch (this.type) {
            case 'hasMany':
                this.pivot = false;
                break;
            case 'belongsTo':
                this.pivot = false;
                break;
            default:
                return; // todo should throw error;
        }
    }

    private setRelationKey(key: string = null): void {
        this.relationKey = (key) ? key : this.defaultRelationKey();
    }
    private setObjectKey(key: string): void{
        this.objectKey = (key) ? key : this.defaultObjectKey();
    }

    private defaultRelationKey(): string {
        return (!this.returnArray)
            ? this.name.toLowerCase() + '_id'
            : this.name.toLowerCase() + '_ids';
    }
    private defaultObjectKey(): string {
        return (!this.returnArray)
            ? this.name.toLowerCase()
            : this.name.toLowerCase() + 's';
    }
}

