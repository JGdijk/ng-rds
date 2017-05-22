import { NgModule, ModuleWithProviders } from '@angular/core';

import {RdsService} from "./rds.service";
import {ModelConfig} from "./rds/model/model";

export * from './rds.service';
export {ModelConfig, Model} from "./rds/model/model";

@NgModule()
export class RdsModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: RdsModule,
      providers: [RdsService]
    };
  }
}
