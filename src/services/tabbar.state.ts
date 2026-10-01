import { Injectable, signal } from '@angular/core';

export interface TabItem {
  /** 页面路径，必须与 app.config.json 的 tabBar.list.pagePath 一致 */
  path: string;
  text: string;
  /** 用 emoji 当图标，省掉图片资源 */
  icon: string;
}

/**
 * 自定义 tabBar 的共享状态。
 *
 * 小程序的自定义 tabBar 是**每个 tab 页各挂一个组件实例**，不是单例视图，
 * 所以「当前选中第几个」必须放在跨组件共享的地方 —— root provider + signal
 * 正好：页面在 ngOnInit 里 markActive(i)，tabBar 组件读到 signal 变化自动刷新。
 */
@Injectable({ providedIn: 'root' })
export class TabbarState {
  readonly items: TabItem[] = [
    { path: '/pages/home/home-entry', text: '首页', icon: '🏠' },
    { path: '/pages/library/library-entry', text: '组件库', icon: '📚' },
    { path: '/pages/wxs/wxs-entry', text: 'WXS', icon: '⚡' },
    { path: '/pages/subpkg/subpkg-entry', text: '分包', icon: '📦' },
  ];

  readonly selected = signal(0);

  /** 页面激活时把 tabBar 切到自己（不跳转） */
  markActive(index: number) {
    this.selected.set(index);
  }

  /** tabBar 点击：切选中态 + switchTab */
  go(index: number) {
    if (index === this.selected()) {
      return;
    }
    this.selected.set(index);
    wx.switchTab({ url: this.items[index].path });
  }
}
