import { Component, inject, signal } from '@angular/core';
import { LocaleId, applyLocale, readStoredLocale } from '../../services/locale';
import { TabbarState } from '../../services/tabbar.state';
/**
 * 运行时 i18n demo。
 *
 * 接线只有两处，都在构建配置里，业务代码不需要任何封装：
 *   1. angular.json 的 `polyfills` 写 `@angular/localize` —— 构建器据此把
 *      `@angular/localize/init` 装进 polyfills 入口，它唯一的作用是挂上全局
 *      `$localize`；不声明就完全不装，没做 i18n 的项目不付这份体积。
 *   2. tsconfig 的 `types` 加 `@angular/localize/init`，让 `$localize` 有类型。
 *
 * 别在源码里 `import '@angular/localize/init'`：官方定位它是 polyfill，CLI
 * 对这种写法发警告，而且它得赶在业务模块求值之前跑完才有意义。
 *
 * 生效时机是这里最容易踩的一点：模板文案的译文在组件 `consts` 首次求值时就
 * 定死了，`consts` 每个组件类型只求一次。所以译文必须在**该组件首次渲染之前**
 * 就位（本页靠 main.ts 启动时应用），运行中切换只对没渲染过的组件生效。
 */
@Component({
  selector: 'app-i18n-demo',
  standalone: true,
  templateUrl: './i18n.component.html',
})
export class I18nDemoComponent {
  private readonly tabbar = inject(TabbarState);

  readonly locale = signal(readStoredLocale());
  readonly count = signal(0);
  readonly gender = signal<'male' | 'female' | 'other'>('other');
  /**
   * `$localize` 也能直接用在 TS 里。写成模板标签，不能当普通函数调
   * （拿不到 `.raw` 会炸）；显式 id 用 `:@@id:文案` 的形式。
   *
   * 它是**取值时**求值，所以换语言后立刻跟着变 —— 模板文案做不到这点。
   */
  get liveLabel() {
    return $localize`:@@i18n.live:这一行每次取值都重新求值`;
  }

  constructor() {
    this.tabbar.markActive(4);
  }

  add() {
    this.count.update((n) => n + 1);
  }

  cycleGender() {
    this.gender.update((g) =>
      g === 'male' ? 'female' : g === 'female' ? 'other' : 'male',
    );
  }

  use(id: LocaleId) {
    this.locale.set(id);
    applyLocale(id);
  }

  /** 已渲染过的组件译文定死了，只能重启小程序重新一遍 */
  restart() {
    wx.restartMiniProgram({ path: '/pages/i18n/i18n-entry' });
  }
}
