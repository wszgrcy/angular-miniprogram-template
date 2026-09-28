import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FirstComponent } from 'first';
import { Component1Component } from '../../components/component1/component1.component';

@Component({
  selector: 'app-page1',
  standalone: true,
  imports: [CommonModule, FirstComponent, Component1Component],
  templateUrl: './page1.component.html',
  styleUrls: ['./page1.component.css'],
})
export class Page1Component {
  /**
   * 状态一律用 signal。
   *
   * 本库始终 zoneless（不带 zone.js）：普通字段改了不会触发任何
   * 刷新，得手动 `ChangeDetectorRef`。signal 被模板读取后，写入会
   * 自动把视图标脏并调度变更检测，模板里用 `user()` 调用取值。
   */
  readonly user = signal('开发者');
}
