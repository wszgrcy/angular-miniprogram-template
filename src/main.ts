import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { platformWeixinMiniProgram } from 'angular-miniprogram';
import 'zone.js';
import { MainModule } from './main.module';
if (environment.production) {
  enableProdMode();
}

platformWeixinMiniProgram()
  .bootstrapModule(MainModule)
  .catch((err) => console.error(err));
