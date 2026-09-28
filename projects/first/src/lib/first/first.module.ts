import { NgModule } from '@angular/core';
import { FirstComponent } from './first.component';

/**
 * 兼容层：`FirstComponent` 已经是 standalone，
 * 这里只是把 standalone 组件再包一层 NgModule，
 * 方便还在用 NgModule 写法的老工程。新工程直接 import `FirstComponent` 即可。
 */
@NgModule({
  imports: [FirstComponent],
  exports: [FirstComponent],
})
export class FirstModule {}
