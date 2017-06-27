import { NgModule, ModuleWithProviders } from '@angular/core';

import {RdsService} from "./rds.service";
import {ModelConfig} from "./rds/model/model";

export * from './rds.service';
export {ModelConfig, Model} from "./rds/model/model";
export {WhereCallback} from "./rds/statements/controllers/where-callback";
export {JoinCallback} from "./rds/statements/controllers/join-callback";
export {WhereHasCallback} from "./rds/statements/controllers/where-has-callback"

@NgModule()
export class RdsModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: RdsModule,
      providers: [RdsService]
    };
  }
}
