import {RelationWithObject, VaultObject} from "../vault/vault-object";
import {vault} from "../vault/vault";

export class JoinStatement {

    private key: string;

    private origin: string;

    constructor(statement: any, origin: string) {
        this.key = vault.get(origin).relations.relationName(statement); //todo throw error if not exists?
        this.origin = origin;
    }

    public has(key: string): boolean {
        return (this.key === key);
    }

    public objectKey(): string {
        return vault.get(this.origin).relations.use(this.key).objectKey;
    }

    public attach(origin: string, data: any): any {
        let vaultObject: VaultObject = vault.get(origin);

        // for each object
        if(Array.isArray(data)) {
            for (let m of data) {
                let relation: RelationWithObject = vaultObject.getRelations(this.key, m[vaultObject.primaryKey]);
                m[relation.name] = relation.data;
            }
        } else {
            let relation: RelationWithObject = vaultObject.getRelations(this.key, data[vaultObject.primaryKey]);
            data[relation.name] = relation.data;
        }

        return data;
    }
}