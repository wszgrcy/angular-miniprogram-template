import { Component } from '@angular/core';

/**
 * 一个文件里放多个组件的 demo：内容投影与兜底必须互斥。
 *
 * 小程序没有原生兜底插槽，构建器把 `<ng-content>兜底</ng-content>` 翻成
 * 「兜底容器有没有视图」的二选一（产物里是 `wx:if="{{nodeList[1].length}}"`
 * / `wx:else`）。所以投了兜底就该消失，没投兜底就该在，两边同时出现或同时
 * 消失都是 bug。
 *
 * 四个组件同处一个文件，入口名由**文件名**推导而不是组件名，编译器要逐个处理
 * 却又只让 entry 导出的那一个当页面 —— 这条路径单组件的 demo 覆盖不到。
 *
 * 样式各归各的：投影进来的内容用宿主（首页）的样式，兜底那段是子组件自己的
 * 模板，得由子组件自己的 wxss 管，所以写在各自的 `styles` 里。
 */
@Component({
  selector: 'proj-child',
  standalone: true,
  styles: [
    `
      .slot {
        padding: 12rpx 16rpx;
        margin: 8rpx 0;
        border-radius: 6rpx;
        background: #fff7e6;
        border-left: 6rpx solid #e6a23c;
        font-size: 24rpx;
        color: #ad6800;
      }
    `,
  ],
  template: `<view class="slot"><ng-content>默认插槽没投影 → 这是兜底</ng-content></view>
    <view class="slot"><ng-content select="[slot='a']">具名插槽没投影 → 这是兜底</ng-content></view>`,
})
export class ProjChildComponent {}

/** 宿主侧共用的标题样式（小程序自定义组件样式默认隔离，各组件自己带） */
const CAP_STYLE = `
  .cap {
    font-size: 22rpx;
    color: #8a9099;
    margin: 16rpx 0 4rpx;
  }
`;

/** 什么都不投：两条兜底都该在 */
@Component({
  selector: 'proj-none',
  standalone: true,
  imports: [ProjChildComponent],
  styles: [CAP_STYLE],
  template: `<p class="cap">1 什么都不投影</p>
    <proj-child></proj-child>`,
})
export class ProjNoneComponent {}

/** 只投默认：默认兜底让位，具名兜底留着 */
@Component({
  selector: 'proj-default',
  standalone: true,
  imports: [ProjChildComponent],
  styles: [CAP_STYLE],
  template: `<p class="cap">2 只投默认插槽</p>
    <proj-child><text class="host">外部内容（默认）</text></proj-child>`,
})
export class ProjDefaultComponent {}

/** 只投具名：具名兜底让位，默认兜底留着 */
@Component({
  selector: 'proj-named',
  standalone: true,
  imports: [ProjChildComponent],
  styles: [CAP_STYLE],
  template: `<p class="cap">3 只投具名插槽</p>
    <proj-child><text class="host">外部内容（具名）</text></proj-child>`,
})
export class ProjNamedComponent {}
