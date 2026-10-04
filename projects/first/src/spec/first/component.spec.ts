import { Injector } from '@angular/core';
import { ComponentFinderService } from 'angular-miniprogram';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { SecondaryPanelComponent } from 'first/secondary';
import { FirstTestComponent } from './first-test.component';

const TARGET_PAGE = '/pages/first/first-test-component-entry';

function waitLoad() {
  return new Observable<any>((ob) => {
    // 未公开方法
    (wx as any).onAppRoute((result: any) => {
      ob.next(result);
    });
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 轮询等一个值出现。
 *
 * 页面的 Angular 实例是异步挂到小程序页面对象上的，`beforeEach` 里
 * 「已经在目标页」并不代表挂好了。直接读会拿到 undefined。
 */
async function waitFor<T>(what: string, read: () => T | undefined, timeout = 8000) {
  const started = Date.now();
  for (;;) {
    const value = read();
    if (value) {
      return value;
    }
    if (Date.now() - started > timeout) {
      throw new Error(`${what} 等待 ${timeout}ms 超时，${await pageHint()}`);
    }
    await sleep(50);
  }
}

/** 超时时把页面现状拼一句话，不然只能看到「拿不到实例」这种无用信息 */
async function pageHint() {
  const pg: any = getCurrentPages()[0] || {};
  const onLoad = pg.__lifeTimePromiseObject && pg.__lifeTimePromiseObject['onLoad'];
  let onLoadState = 'no-onLoad-promise';
  if (onLoad) {
    const oneLine = (v: unknown) => String(v).split('\n').join(' | ');
    onLoadState = await Promise.race([
      onLoad.then(() => 'ok').catch((e: any) => oneLine(e && (e.stack || e.message) || e)),
      new Promise((r) => setTimeout(() => r('still-pending'), 200)),
    ]);
  }
  return `route=${pg.route} hasLoad=${pg.data && pg.data.hasLoad} bootstrap=${(wx as any).__bootstrapError ?? 'ok'} onLoad=${onLoadState}`;
}

/** 取某个节点的计算布局，断言它真的渲染出来了 */
function boundingRect(host: any, selector: string) {
  return new Promise<WechatMiniprogram.BoundingClientRectCallbackResult>((res, rej) => {
    const query = host.createSelectorQuery();
    query
      .select(selector)
      .boundingClientRect((result) => {
        const rect = result as WechatMiniprogram.BoundingClientRectCallbackResult;
        if (!rect) {
          rej(new Error(`${selector} 查不到节点`));
          return;
        }
        res(rect);
      })
      .exec();
  });
}

async function toWxInstance(finder: ComponentFinderService, ngInstance: unknown) {
  // ComponentFinderService.get() 返 Promise，不是 Observable，别 .pipe()
  return await finder.get(ngInstance as never);
}

/** 取节点的真实 dataset（wxml 里的 data-node-path / data-node-index 就在里面） */
function nodeDataset(host: any, selector: string): Promise<Record<string, any>> {
  return new Promise((res, rej) => {
    host
      .createSelectorQuery()
      .select(selector)
      .fields({ dataset: true }, (r: any) => {
        if (!r) {
          rej(new Error(`${selector} 查不到节点`));
          return;
        }
        res(r.dataset);
      })
      .exec();
  });
}

/**
 * 按 wxml 实际绑定的事件名，向页面实例派发一次事件。
 *
 * wxml 上的 `bind:tap="bindEvent"` 就是页面实例的 `bindEvent`，
 * 它拿 `event.type` 去查 Angular 侧注册的监听名。所以这一发能跑完
 * 「wxml 事件名 → bindEvent → Angular listener」整条链。
 */
async function dispatchTap(page: any, selector: string, type = 'tap') {
  const dataset = await nodeDataset(page, selector);
  page.bindEvent({ type, currentTarget: { dataset } });
}

describe('库出口 / 渲染 / select 查询', () => {
  beforeEach(async () => {
    // 已经在目标页就不用再跳（小程序启动进来就是这一页）
    const current = getCurrentPages()[0];
    if (current && current.route === TARGET_PAGE.slice(1)) {
      return;
    }

    // 必须**先订阅再跳转**。onAppRoute 是事件流，不会重发历史，
    // 等 reLaunch 完了再去注册，路由事件早就发出去了，
    // 这个 await 会一直挂到 vitest 的 hookTimeout。
    const loaded = waitLoad()
      .pipe(
        filter((item) => item.openType === 'reLaunch'),
        take(1),
      )
      .toPromise();

    await new Promise((res, rej) =>
      wx.reLaunch({ url: TARGET_PAGE, success: res, fail: rej }),
    );
    await loaded;
  });

  async function pageContext() {
    const page = getCurrentPages()[0];
    expect(!!page, '页面为空').toBe(true);
    const vm = (await waitFor(
      '页面 Angular 实例',
      () => (page as any).__ngComponentInstance,
    )) as FirstTestComponent;
    const injector: Injector = (page as any).__ngComponentInjector;
    const finder = injector.get(ComponentFinderService);
    return { vm, finder };
  }

  it('一级出口组件渲染并可被 select 查到', async () => {
    const { vm, finder } = await pageContext();
    expect(vm.firstComponent, '拿不到一级出口组件实例').toBeTruthy();

    const wxComponent = await toWxInstance(finder, vm.firstComponent);
    expect(
      !!wxComponent,
      '一级出口组件没有对应的小程序实例',
    ).toBe(true);

    const rect = await boundingRect(wxComponent, '.lib-first');
    expect(rect.height).toBeGreaterThan(0);
  });

  it('二级出口组件渲染并可被 select 查到', async () => {
    const { vm, finder } = await pageContext();
    expect(vm.secondComponent, '拿不到二级出口组件实例').toBeTruthy();

    const wxComponent = await toWxInstance(finder, vm.secondComponent);
    expect(
      !!wxComponent,
      '二级出口组件没有对应的小程序实例',
    ).toBe(true);

    const rect = await boundingRect(wxComponent, '.lib-secondary');
    expect(rect.height).toBeGreaterThan(0);
  });

  it('signal 驱动组件状态与 @Output 抛父', async () => {
    const { vm } = await pageContext();
    const first = vm.firstComponent;

    expect(first.count()).toBe(0);
    first.inc();
    expect(first.count()).toBe(1);

    let emitted = -1;
    const sub = first.changed.subscribe((n: number) => (emitted = n));
    first.inc();
    expect(emitted).toBe(2);
    sub.unsubscribe();
  });

  it('二级出口 computed 与自带服务可用', async () => {
    const { vm } = await pageContext();
    const second: SecondaryPanelComponent = vm.secondComponent;

    expect(second.price()).toBe(300);
    expect(second.discounted()).toBe(240);

    const before = second.svc.hits();
    second.touch();
    expect(second.svc.hits()).toBe(before + 1);
  });

  it('tap 事件能从 wxml 派发到 Angular 监听', async () => {
    const { vm } = await pageContext();
    const page: any = getCurrentPages()[0];

    const before = vm.taps();
    await dispatchTap(page, '#tap-probe');
    expect(vm.taps()).toBe(before + 1);
  });

  it('@for 里的 tap 能命中对应那一项', async () => {
    const { vm } = await pageContext();
    const page: any = getCurrentPages()[0];

    const before = vm.probeHits().length;
    await dispatchTap(page, '#for-probe-1');
    expect(
      vm.probeHits().length,
      '@for 内的 tap 完全没进监听 → 控制流内事件链断了',
    ).toBe(before + 1);
    expect(vm.probeHits()[before]).toBe(1);

    await dispatchTap(page, '#for-probe-2');
    expect(vm.probeHits()[before + 1]).toBe(2);
  });

  it('click 不是小程序事件，派发了不会命中 tap 监听', async () => {
    const { vm } = await pageContext();
    const page: any = getCurrentPages()[0];

    const before = vm.taps();
    await dispatchTap(page, '#tap-probe', 'click');
    expect(vm.taps()).toBe(before);
  });
});
