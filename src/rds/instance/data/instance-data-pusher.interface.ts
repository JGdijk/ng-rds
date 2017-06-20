import {WhereStatementController} from "../../statements/controllers/where-statement-controller";
import {JoinStatementController} from "../../statements/controllers/join-statement-controller";
import {OrderByStatementController} from "../../statements/controllers/orderby-statement-controller";

export interface InstanceDataPusherInterface {
    whereStatementController: WhereStatementController;
    joinStatementController: JoinStatementController;
    orderByStatementController: OrderByStatementController;
}