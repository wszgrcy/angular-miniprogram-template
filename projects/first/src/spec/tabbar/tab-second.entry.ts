import { Component } from '@angular/core';
import { bootstrapPage } from 'angular-miniprogram';

/** tabBar 需要至少两个 tab 页，这是凑数的第二个 */
@Component({
  selector: 'spec-tab-second',
  standalone: true,
  template: `<view class="page">tab 第二页</view>`,
})
export class SpecTabSecondComponent {}

bootstrapPage(SpecTabSecondComponent);
