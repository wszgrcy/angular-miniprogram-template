import { Component, ViewChild, signal } from '@angular/core';
import { FirstComponent } from '../../public-api';
// 二级出口：从库的二级入口引，验证「一级 + 二级」在同一个小程序运行时里都能渲染
import { SecondaryPanelComponent } from 'first/secondary';

@Component({
  selector: 'app-first-test',
  standalone: true,
  imports: [FirstComponent, SecondaryPanelComponent],
  templateUrl: './first-test.component.html',
})
export class FirstTestComponent {
  readonly title = 'karma 传入的一级出口标题';

  /** tap 探针：由 spec 直接派发 wxml 绑上的事件，验证事件名走通 */
  readonly taps = signal(0);
  onTap() {
    this.taps.update((n) => n + 1);
  }

  /**
   * `@for` 里的 tap 探针。
   *
   * 控制流内的元素，事件路径多一段 `['directive', 容器槽, 子视图序号]`，
   * 回解析口径和顶层节点不一样。自定义 tabBar 的 tab 按钮就是这个形状。
   */
  readonly probeItems = signal([
    { id: 0, label: 'probe-a' },
    { id: 1, label: 'probe-b' },
    { id: 2, label: 'probe-c' },
  ]);
  readonly probeHits = signal<number[]>([]);
  onProbeTap(id: number) {
    this.probeHits.update((list) => [...list, id]);
  }

  @ViewChild('first', { static: true }) firstComponent!: FirstComponent;

  @ViewChild('second', { static: true }) secondComponent!: SecondaryPanelComponent;
}
