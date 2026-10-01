import { Component, signal } from '@angular/core';

/**
 * 分包页面二：订单。
 *
 * 与 goods 同属分包 packageA，互跳走 navigateTo 即可。
 */
@Component({
  selector: 'app-package-a-order',
  standalone: true,
  template: `
    <div class="page">
      <h1 class="page__title">分包 packageA · 订单</h1>
      <div class="card">
        <p class="card__label">订单列表</p>
        @for (o of orders(); track o.no) {
          <div class="row">
            <span class="row__name">{{ o.no }}</span>
            <span class="row__desc">{{ o.status }}</span>
          </div>
        } @empty {
          <div class="empty">暂无订单</div>
        }
        <button class="btn" (tap)="addOrder()">造一条订单</button>
      </div>
    </div>
  `,
})
export class PackageAOrderComponent {
  readonly orders = signal([
    { no: 'A20260101', status: '待支付' },
    { no: 'A20260102', status: '已完成' },
  ]);

  addOrder() {
    this.orders.update((list) => [
      ...list,
      { no: 'A2026' + (1000 + list.length), status: '待支付' },
    ]);
  }
}
