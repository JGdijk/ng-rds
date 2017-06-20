import {VaultObject} from "./vault-object";
import {Observable} from "rxjs";
import {ModelConfig} from "../model/model";
import {InstanceController} from "../instance/instance-controller";
import {Collector} from "../collector/collector";

type VaultObjects = {
    [key: string]: VaultObject
}

export class Vault {

    /**
     * Holds all the different vault objects initiated by the user.
     * @private {VaultObjects}
     */
    private objects: VaultObjects = {};

    /**
     * Broadcasts the different events on editing data to all the instance listeners.
     * @private {any}
     */
    private broadcaster: any;

    /**
     * Used to push the collector trough the broadcaster after editing data.
     * @private {any}
     */
    private observer: any;

    /**
     * Sets the broadcaster and turn it into a hot observable.
     * @constructor
     */
    constructor(){
        this.broadcaster = new Observable(observer => {
            this.observer = observer;
        }).publish();
        this.broadcaster.connect();
    }

    /**
     * Receives the config classes made by the user and initiate the vault objects and relations for use.
     * @public
     * @param {ModelConfig[]} classes A collection of config objects to setup the vault as desired by the user.
     */
    public config(classes: ModelConfig[]): void {

        //instantiate the vaultObjects
        for (let c of classes) {
            c.name = new c.model().constructor.name;
            this.objects[c.name] = new VaultObject(c);
        }

        // instantiate the relations between the vaultObjects as configured by the user
        // we want to do this after the vaultObjects have been instantiated because of the use of mirror relations and
        // for that the relational VaultObject does need to exist already
        for (let i in this.objects) {
            this.objects[i].relations.activate();
        }
    }

    /**
     * VaultObject getter
     * @public {VaultObject}
     * @param {string} key Name of the VaultObject that is requested.
     */
    public get(key: string): VaultObject {
        return this.objects[key];
    }

    /**
     * Adds objects to the vault and pushes a resulting collector trough the broadcaster to all instances.
     * @public
     * @param {string} key The name of the VaultObject that will fire the action.
     * @param {any | any[]} objects The added objects that need to be processed.
     */
    public add(key: string, objects: any | any[]): void {
        let collector: Collector = new Collector();
        this.get(key).add(objects,collector);
        this.observer.next(collector);
    }

    /**
     * Updates the requested objects with the given data and pushes a resulting collector trough the broadcaster to all
     *  instances.
     * @public {VaultObject}
     * @param {string} key The name of the VaultObject that will fire the action.
     * @param {number | number[]} ids The ids of the vault objects the update needs to be applied to.
     * @param {any} data The changes that need to be made to the objects.
     */
    public update(key: string, ids: number | number[], data: any): void {
        ids = (Array.isArray(ids)) ? ids : [ids];

        let collector: Collector = new Collector();
        collector = this.get(key).update(ids, data, collector);

        this.observer.next(collector);
    }

    /**
     * Deletes the selected objects and pushes a resulting collector trough the broadcaster to all instances.
     * @public {VaultObject}
     * @param {string} key The name of the VaultObject that will fire the action.
     * @param {number | number[]} ids The ids of the vault objects who need to be deleted.
     */
    public remove(key: string, ids: number | number[]): void {
        ids = (Array.isArray(ids)) ? ids : [ids];

        let collector: Collector = new Collector();
        collector = this.get(key).remove(ids, collector);

        this.observer.next(collector);
    }

    /**
     * Attaches relations to the given models and pushes a resulting collector trough the broadcaster to all instances.
     * @public
     * @param {string} key The name of the VaultObject that will fire the action.
     * @param {number | number[]} ids The ids of the vault objects on who the relations will be attached
     * @param {string} relation The name of the relational VaultObject.
     * @param {number | number[]} relationIds The ids of the relational VaultObject.
     */
    public attach(key: string,
                  ids: number | number[],
                  relation: string,
                  relationIds: number | number[]): void {

        //todo we need to check the wildcard, if its not a number, or number[] or '*' throw error
        ids = (Array.isArray(ids)) ? ids : [ids];
        relationIds = (Array.isArray(relationIds)) ? relationIds : [relationIds];

        let collector: Collector = new Collector();
        collector = this.get(key).attach(ids, relation, relationIds, collector);

        this.observer.next(collector);
    }

    /**
     * Detaches relations from the given models and pushes a resulting collector trough the broadcaster to all
     *  instances.
     * @public
     * @param {string} key The name of the VaultObject that will fire the action.
     * @param {number | number[]} ids The ids of the vault objects on who the relations will be attached
     * @param {string} relation The name of the relational VaultObject.
     * @param {number | number[]} relationIds The ids of the relational VaultObject.
     */
    public detach(key: string,
                  ids: number | number[],
                  relation: string,
                  relationIds: string | number | number[]): void {

        //todo we need to check the wildcard, if its not a number, or number[] or '*' throw error
        ids = (Array.isArray(ids)) ? ids : [ids];
        //we need to change type because the vault object expects number[]
        let fixedRelationIds: any = (relationIds === '*')
            ? null
            : (Array.isArray(relationIds)) ? relationIds : [relationIds];

        let collector: Collector = new Collector();
        collector = this.get(key).detach(ids, relation, fixedRelationIds, collector);

        this.observer.next(collector);
    }

    /**
     * The Observable all the instances subscribe to so they can listen for changes made in the vaults data
     * @public {Observable<Collector>}
     */
    public broadcasting(): Observable<Collector> {
        return this.broadcaster;
    }

    /**
     * Receives the config classes made by the user and initiate the vault objects and relations for use.
     * @public {void}
     * @param {string} key The name of the requested InstanceController.
     */
    public use(key): InstanceController {
        return this.get(key).instance;
    }

}

export const vault = new Vault();
