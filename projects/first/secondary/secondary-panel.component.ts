import {
  Component,
  HostBinding,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { SecondaryService } from './secondary.service';

/**
 * 二级出口组件（`import { SecondaryPanelComponent } from 'first/secondary'`）。
 *
 * 和一级出口组件走**完全相同**的元数据链路，但产物目录不同：
 *   一级 → library/first/first-component/first-component
 *   二级 → library/first/secondary/secondary-panel-component/...
 *
 * 刻意把 signal input / signal output / computed / @HostBinding / 注入二级服务
 * 都摆上，任何一环没走通页面上都看得见。
 */
@Component({
  selector: 'lib-secondary-panel',
  standalone: true,
  template: `
    <div class="lib-secondary">
      <div class="lib-secondary__title">{{ title() }}</div>
      <div class="lib-secondary__row">来源：{{ svc.tag }}</div>
      <div class="lib-secondary__row">
        原价 {{ price() }} → 折后 {{ discounted() }}
      </div>
      <div class="lib-secondary__row">服务被调用 {{ svc.hits() }} 次</div>
      <button class="lib-secondary__btn" (tap)="touch()">调用二级服务</button>
    </div>
  `,
  styleUrls: ['./secondary-panel.component.scss'],
})
export class SecondaryPanelComponent {
  readonly title = input('二级出口组件（first/secondary）');

  readonly price = input(100);

  /** 子 → 父：调用一次抛一次累计值 */
  readonly touched = output<number>();

  @HostBinding('class') hostClass = 'lib-secondary-host';

  readonly svc = inject(SecondaryService);

  readonly discounted = computed(() => Math.round(this.price() * 0.8));

  touch() {
    this.touched.emit(this.svc.touch());
  }
}
