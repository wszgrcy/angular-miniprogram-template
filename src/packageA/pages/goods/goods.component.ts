import { Component, OnInit, inject, signal } from '@angular/core';

/**
 * 分包页面一：商品。
 *
 * 源码在 `src/packageA/`，产物在 `packageA/`（分包 root 同时是源码目录与产物目录）。
 * 分包页可以随意 import 主包 / 其他分包的模块（非独立分包）。
 */
@Component({
  selector: 'app-package-a-goods',
  standalone: true,
  template: `
    <div class="page">
      <h1 class="page__title">分包 packageA · 商品</h1>
      <p class="page__hint">
        本页属于分包 <code>packageA</code>，只有跳进来才会下载。
      </p>
      <div class="card">
        <p class="card__label">分包内状态</p>
        <p class="card__big">{{ goods() }}</p>
        <button class="btn btn--primary" (tap)="add()">加一件</button>
        <button class="btn" (tap)="goOrder()">去订单页（同分包）</button>
      </div>
    </div>
  `,
})
export class PackageAGoodsComponent implements OnInit {
  readonly goods = signal(0);

  ngOnInit() {
    wx.showToast({ title: '分包 packageA 已加载', icon: 'none' });
  }

  add() {
    this.goods.update((n) => n + 1);
  }

  goOrder() {
    wx.navigateTo({ url: '/packageA/pages/order/order-entry' });
  }
}
