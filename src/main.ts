import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from 'angular-miniprogram';

if (environment.production) {
  enableProdMode();
}

// 小程序没有「启动组件」，这里只创建 ApplicationRef。
// 页面 / 组件由各页面的 `*.entry.ts`（bootstrapPage）逐个挂进来。
bootstrapApplication().catch((err) => console.error(err));
