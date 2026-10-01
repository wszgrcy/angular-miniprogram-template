import { Component, NO_ERRORS_SCHEMA, OnInit, inject, signal } from '@angular/core';
import { TabbarState } from '../../services/tabbar.state';

/**
 * WXS（渲染层脚本）使用 demo。
 *
 * 声明方式照 uni-app 的显式引入模型，写在模板里：
 *   <wxs module="fmt" src="./format.wxs"></wxs>
 * `src` 相对**组件源文件**解析，共享脚本写 `../../common/xxx.wxs` 即可。
 *
 * 需要 NO_ERRORS_SCHEMA：`<wxs>` 与 `fmt.xxx` 都不是 Angular 的东西，
 * 它们由构建器在模板上摘除 / 改写成渲染层调用。
 */
@Component({
  selector: 'app-wxs-demo',
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './wxs.component.html',
  styleUrls: ['./wxs.component.scss'],
})
export class WxsDemoComponent implements OnInit {
  private readonly tabbar = inject(TabbarState);

  readonly price = signal(1234.5);
  readonly big = signal(1234567);
  readonly long = signal('这是一段很长很长很长很长需要截断的文案');
  readonly on = signal(false);

  ngOnInit() {
    this.tabbar.markActive(2);
  }

  toggle() {
    this.on.update((v) => !v);
  }
}
