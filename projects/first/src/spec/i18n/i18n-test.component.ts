import { Component, signal } from '@angular/core';

/**
 * 运行时 i18n 的 fixture。
 *
 * 单独开一页，是为了在真机运行时里钉住四件事：静态文案、带插值的文案、
 * ICU 的 select / plural 分支、`i18n-alt` 这类属性消息。这四条走的是
 * 不同的编译产物（`ɵɵi18nStart/Expand/Q` 组合），漏一条都可能构建绿、
 * 页面上 ICU 原文照登。
 *
 * 带 ICU 的那两行**不能折行**：ICU 前后的空白会被并进消息本体，折一次
 * 译文就对不上 id 之外的空白归一化结果。
 */
@Component({
  selector: 'app-i18n-test',
  standalone: true,
  template: `
    <p class="t-title" i18n="@@spec.title">标题</p>
    <p class="t-count" i18n="@@spec.count">有 {{ count() }} 件</p>
    <p class="t-select" i18n="@@spec.select">{gender(), select, male {他} female {她} other {TA}}</p>
    <p class="t-plural" i18n="@@spec.plural">{count(), plural, =0 {还没有} one {只有一件} other {{{count()}} 件}}</p>
    <image class="t-img" i18n-alt="@@spec.alt" alt="照片 {{ count() }}" />
  `,
})
export class I18nTestComponent {
  readonly count = signal(0);
  readonly gender = signal<'male' | 'female' | 'other'>('other');
}
