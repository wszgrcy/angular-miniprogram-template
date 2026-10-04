import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from 'angular-miniprogram';
import { applyLocale, readStoredLocale } from './services/locale';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// 必须在 bootstrap 之前：模板文案的译文在组件 consts 首次求值时就定死了，
// 而 consts 每个组件类型只求一次。启动时先就位，第一个页面才是对的语言。
applyLocale(readStoredLocale());

// 小程序没有「启动组件」，这里只创建 ApplicationRef。
// 页面 / 组件由各 `*.entry.ts` 的 default export 逐个挂进来。
bootstrapApplication().catch((err) => console.error(err));
