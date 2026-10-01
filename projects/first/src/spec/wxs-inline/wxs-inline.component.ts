import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';

/**
 * inline `template` 的 wxs fixture。
 *
 * 存在的理由：`templateUrl` 和 inline 走的是两条不同的剥离路径 ——
 * 前者按外部文件扫，后者得从 .ts 里把字面量抽出来。只测前者会漏掉整条
 * inline 链路，所以单独开一个页面钉住它。
 */
@Component({
  selector: 'app-wxs-inline-test',
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <wxs module="fmt" src="../wxs/format.wxs"></wxs>
    <p class="i-money">money={{ fmt.money(price()) }}</p>
    <div [class]="fmt.badge(3)">badge</div>
  `,
})
export class WxsInlineTestComponent {
  readonly price = signal(1234.5);
}
