
import {ModelConfig} from "./rds/model/model";
import {vault} from "./rds/vault/vault";
import {InstanceController} from "./rds/instance/instance-controller";
import {Injectable} from "@angular/core";

@Injectable()
export class RdsService {

    /**
     * Receives the config classes made by the user and initiate the vault objects and relations for use.
     * @public
     * @param {ModelConfig[]} classes A collection of config objects to setup the vault as desired by the user.
     */
    public config(classes: ModelConfig[]): void {
        vault.config(classes);
    }

    /**
     * Retrieves the requested InstanceController.
     * @public {void}
     * @param {string} key The name of the requested InstanceController.
     */
    public use(key: string): InstanceController {
        return vault.use(key);
    }

}