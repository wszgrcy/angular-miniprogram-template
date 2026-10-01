import { Component, OnInit, inject, signal } from '@angular/core';
import { TabbarState } from '../../services/tabbar.state';

/**
 * 分包入口页（主包）。
 *
 * 分包页不能当 tabBar 页（小程序限制），所以入口按钮放在主包，
 * 由这里 navigateTo 进分包。第一次跳会触发分包下载。
 */
@Component({
  selector: 'app-subpkg-entry',
  standalone: true,
  templateUrl: './subpkg.component.html',
})
export class SubpkgEntryComponent implements OnInit {
  private readonly tabbar = inject(TabbarState);

  readonly lastJump = signal('（还没跳过）');

  ngOnInit() {
    this.tabbar.markActive(3);
  }

  go(url: string, label: string) {
    this.lastJump.set(label + ' → ' + url);
    wx.navigateTo({ url });
  }
}
