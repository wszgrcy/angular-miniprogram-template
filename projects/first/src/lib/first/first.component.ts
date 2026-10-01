import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

/**
 * 一级出口组件（`import { FirstComponent } from 'first'`）。
 *
 * 故意把 @Input / @Output / signal 都摆上，让「一级出口」这条链路
 * 覆盖到最常见的三种交互：父传子、子抛父、组件内部状态。
 */
@Component({
  selector: 'lib-first',
  standalone: true,
  template: `
    <div class="lib-first">
      <div class="lib-first__title">{{ title }}</div>
      <div class="lib-first__body">一级出口 first · 内部计数 {{ count() }}</div>
      <button class="lib-first__btn" (tap)="inc()">+1 并抛出 changed</button>
    </div>
  `,
  styleUrls: ['./first.component.scss'],
})
export class FirstComponent {
  @Input() title = '一级出口组件（first）';

  @Output() changed = new EventEmitter<number>();

  readonly count = signal(0);

  inc() {
    const next = this.count() + 1;
    this.count.set(next);
    this.changed.emit(next);
  }
}
