import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';

/**
 * wxs 渲染层脚本的 karma fixture。
 *
 * `styleUrls` 是刻意留下的：带 wxs 的组件要走 fileReplacements 换文件，
 * 换完位置后样式解析不到就会把组件 poison 掉，AOT 静默退化成 JIT ——
 * 页面看着在，模板函数却没生成。样式必须跟着进 cache，这里钉住它。
 */
@Component({
  selector: 'app-wxs-test',
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './wxs-test.component.html',
  styleUrls: ['./wxs-test.component.scss'],
})
export class WxsTestComponent {
  readonly price = signal(1234.5);
  readonly big = signal(1234567);
  readonly long = signal('这是一段很长很长很长很长需要截断的文案');
  readonly on = signal(false);
  readonly dyn = signal(7);

  toggle() {
    this.on.update((v) => !v);
  }
}
