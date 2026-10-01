import { Injectable, signal } from '@angular/core';

/**
 * 一级出口自带的服务。
 *
 * 用来验证库的 root provider 在小程序侧同样可用
 * （由 bootstrapApplication 创建的 injector 提供）。
 */
@Injectable({ providedIn: 'root' })
export class FirstService {
  readonly tag = 'from first';

  /** 被消费次数 */
  readonly hits = signal(0);

  touch() {
    return this.hits.update((n) => n + 1);
  }
}
