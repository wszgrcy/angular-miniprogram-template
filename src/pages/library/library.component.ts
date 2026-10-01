import { Component, OnInit, inject, signal } from '@angular/core';
// 一级出口：包名本身
import { FirstComponent, FirstService } from 'first';
// 二级出口：包名 + 子路径，产物是独立的 fesm2022/first-secondary.mjs
import { SecondaryPanelComponent, SecondaryService } from 'first/secondary';
import { TabbarState } from '../../services/tabbar.state';

/**
 * 库一级 / 二级出口使用 demo。
 *
 * 一级出口 `first`            → library/first/first-component/...
 * 二级出口 `first/secondary` → library/first/secondary/secondary-panel-component/...
 *
 * 两个 entry point、两份产物文件，但用法完全一致：
 * import 进来塞进 `imports` 数组即可。
 */
@Component({
  selector: 'app-library-demo',
  standalone: true,
  imports: [FirstComponent, SecondaryPanelComponent],
  templateUrl: './library.component.html',
})
export class LibraryDemoComponent implements OnInit {
  private readonly tabbar = inject(TabbarState);

  /** 两个出口各自带的服务，模板里直接 `xxx.hits()` 读 signal */
  readonly firstService = inject(FirstService);
  readonly secondaryService = inject(SecondaryService);

  /** 父 → 子 */
  readonly title = signal('父组件传入的一级出口标题');
  readonly price = signal(200);

  /** 子 → 父 */
  readonly lastChanged = signal('（还没收到）');
  readonly lastTouched = signal('（还没收到）');

  ngOnInit() {
    this.tabbar.markActive(1);
  }

  onChanged(n: number) {
    this.lastChanged.set(`changed = ${n}`);
  }

  onTouched(n: number) {
    this.lastTouched.set(`touched = ${n}`);
  }

  touchFirst() {
    this.firstService.touch();
  }

  bumpPrice() {
    this.price.update((p) => p + 50);
  }
}
