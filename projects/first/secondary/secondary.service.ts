import { Injectable, signal } from '@angular/core';

/**
 * 二级出口自带的服务。
 *
 * 用来验证「二级出口不只是能导出组件」——服务、常量、纯函数
 * 走的是同一条 `first/secondary` 解析链路。
 */
@Injectable({ providedIn: 'root' })
export class SecondaryService {
  /** 被调用次数，跨组件共享（root provider） */
  readonly hits = signal(0);

  readonly tag = 'from first/secondary';

  touch() {
    this.hits.update((n) => n + 1);
    return this.hits();
  }
}
