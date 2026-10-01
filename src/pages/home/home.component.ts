import { Component, computed, inject, signal } from '@angular/core';
import { TabbarState } from '../../services/tabbar.state';
import { FormsModule } from 'angular-miniprogram/forms';

/**
 * 基础演示页：@if / @for / @switch + signal。
 *
 * 本库始终 zoneless（不带 zone.js）：普通字段改了不会触发任何刷新。
 * 状态一律用 signal，模板里用 `xxx()` 取值，写入会自动标脏并调度变更检测。
 */
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports:[FormsModule]
})
export class HomeComponent {
  private readonly tabbar = inject(TabbarState);

  /** 组件内部状态 */
  readonly title = signal('基础演示');
  readonly count = signal(0);
  readonly showPanel = signal(true);
  readonly keyword = signal('');
  readonly mode = signal<'list' | 'grid' | 'none'>('list');

  readonly list = signal([
    { id: 1, name: 'Angular', desc: '框架本体' },
    { id: 2, name: 'angular-miniprogram', desc: '编译到小程序' },
    { id: 3, name: 'signal', desc: 'zoneless 状态' },
  ]);

  /** 派生状态：computed 自动追踪依赖 */
  readonly doubled = computed(() => this.count() * 2);
  readonly filtered = computed(() => {
    const kw = this.keyword().trim().toLowerCase();
    const all = this.list();
    return kw ? all.filter((it) => it.name.toLowerCase().includes(kw)) : all;
  });

  constructor() {
    // 本页是第 0 个 tab，进页面就把自定义 tabBar 切过来
    this.tabbar.markActive(0);
  }

  inc() {
    this.count.update((n) => n + 1);
  }

  reset() {
    this.count.set(0);
  }

  togglePanel() {
    this.showPanel.update((v) => !v);
  }

  cycleMode() {
    this.mode.update((m) =>
      m === 'list' ? 'grid' : m === 'grid' ? 'none' : 'list',
    );
  }

  trackById(_index: number, item: { id: number }) {
    return item.id;
  }
  inputChange(event:any){
    console.log(event)
  }
}
