import { Component, inject } from '@angular/core';
import { TabbarState } from '../services/tabbar.state';

/**
 * 自定义 tabBar 组件。
 *
 * 微信要求自定义 tabBar 组件**必须**落在产物根目录的 `custom-tab-bar/index`，
 * 所以本目录的入口文件叫 `index.ts`（不是 `*.entry.ts`）——
 * 产物名由源文件名直接推导：`index.ts` → `custom-tab-bar/index.{js,json,wxml,wxss}`。
 *
 * 配合 app.config.json 里 `"tabBar": { "custom": true, "list": [...] }` 生效。
 */
@Component({
  selector: 'app-custom-tabbar',
  standalone: true,
  template: `
    <div class="tabbar">
      @for (item of state.items; track item.path; let i = $index) {
        <div
          class="tabbar__item"
          [class.tabbar__item--on]="i === state.selected()"
          (tap)="state.go(i)"
        >
          <div class="tabbar__icon">{{ item.icon }}</div>
          <div class="tabbar__text">{{ item.text }}</div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./tabbar.component.scss'],
})
export class CustomTabbarComponent {
  readonly state = inject(TabbarState);
}
