import { filter, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

const TARGET_PAGE = '/pages/wxs/wxs-test-entry';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const oneLine = (v: unknown) => String(v).split('\n').join(' | ');

/** 小程序 API 的 fail 回调给的是普通对象，不拼一句话出去就只能看到 [object Object] */
function asError(prefix: string, e: any): Error {
  const detail =
    e && (e.errMsg || e.message || e.stack)
      ? oneLine(e.errMsg || e.message || e.stack)
      : oneLine(JSON.stringify(e));
  return new Error(`${prefix}：${detail}`);
}

function waitLoad() {
  return new Observable<any>((ob) => {
    (wx as any).onAppRoute((result: any) => ob.next(result));
  });
}

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

async function pageHint() {
  const pg: any = getCurrentPages()[0] || {};
  const onLoad = pg.__lifeTimePromiseObject && pg.__lifeTimePromiseObject['onLoad'];
  let onLoadState = 'no-onLoad-promise';
  if (onLoad) {
    onLoadState = await Promise.race([
      onLoad.then(() => 'ok').catch((e: any) => oneLine(e && (e.stack || e.message) || e)),
      new Promise((r) => setTimeout(() => r('still-pending'), 200)),
    ]);
  }
  return `route=${pg.route} hasLoad=${pg.data && pg.data.hasLoad} bootstrap=${(wx as any).__bootstrapError ?? 'ok'} onLoad=${onLoadState}`;
}

function rectOf(host: any, selector: string) {
  return new Promise<WechatMiniprogram.BoundingClientRectCallbackResult>(
    (res, rej) => {
      host
        .createSelectorQuery()
        .select(selector)
        .boundingClientRect((r: any) => {
          if (!r) {
            rej(new Error(`${selector} 查不到节点`));
            return;
          }
          res(r);
        })
        .exec();
    },
  );
}

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

async function dispatchTap(page: any, selector: string) {
  const dataset = await nodeDataset(page, selector);
  page.bindEvent({ type: 'tap', currentTarget: { dataset } });
}

/** 把断言包起来：小程序里抛出的对象不带可读 message，统一转成一行 */
async function show(body: () => Promise<void>) {
  try {
    await body();
  } catch (e: any) {
    if (e && e.message) {
      throw e;
    }
    throw asError('spec 抛出', e);
  }
}

/**
 * WXS 渲染层脚本。
 *
 * 分工先说清楚，不然断言会打错地方：
 *   逻辑层（Angular）只算 wxs 调用的**入参**，下推进 nodeList；
 *   最终文本由 wxml 里的 `{{fmt.money(nodeList[i].value[0])}}` 在渲染层算。
 * 所以：
 *   - 渲染文本读不到（小程序没有读渲染文本的 API），不往这个方向断
 *   - class 是渲染层算完落到节点上的，select 查得到 —— wxs 真跑过没有，
 *     看它最准
 */
describe('WXS 渲染层脚本', () => {
  beforeEach(async () => {
    const current = getCurrentPages()[0];
    if (current && current.route === TARGET_PAGE.slice(1)) {
      return;
    }
    const loaded = waitLoad()
      .pipe(
        filter((item) => item.openType === 'reLaunch'),
        take(1),
      )
      .toPromise();
    await new Promise((res, rej) =>
      wx.reLaunch({ url: TARGET_PAGE, success: res, fail: rej }),
    ).catch((e) => {
      throw asError(`reLaunch ${TARGET_PAGE} 失败`, e);
    });
    await loaded;
  });

  async function pageContext() {
    const page: any = getCurrentPages()[0];
    if (!page) {
      throw new Error(
        `页面为空，当前栈=${JSON.stringify(getCurrentPages().map((p) => p.route))}`,
      );
    }
    await waitFor('页面 Angular 实例', () => page.__ngComponentInstance);
    await waitFor('页面 hasLoad', () => (page.data.hasLoad ? true : undefined));
    return page;
  }

  it('带 wxs 的页面能 AOT 渲染出来（逻辑层不再引用 fmt）', async () => {
    const page = await pageContext();
    const tree = JSON.stringify(page.data.nodeList);

    expect((page.data.nodeList || []).length)
      .withContext(`节点树为空 → ${(await pageHint())}`)
      .toBeGreaterThan(0);
    // 模板里若还残留 fmt 标识符，Angular 编译期就挂了；运行期这里再兜一层
    expect(tree).not.toContain('fmt');
  });

  it('wxs 函数在渲染层真的执行（含 `\'\' + x` 那几个）', async () => {
    const page = await pageContext();

    // badge(3) -> num-03，priceClass(1234.5) -> p-1234_50
    // class 由渲染层算，能 select 到就说明 wxs 模块加载并跑通了
    const badge = await rectOf(page, '.num-03');
    expect(badge.height)
      .withContext('pad() 的 class 没落到节点上 → wxs 没在渲染层跑')
      .toBeGreaterThan(0);

    const price = await rectOf(page, '.p-1234_50');
    expect(price.height)
      .withContext('money() 的 class 没落到节点上 → wxs 没在渲染层跑')
      .toBeGreaterThan(0);
  });

  it('property 绑定把枝叶数组原样下推进 property', async () => {
    const page = await pageContext();
    const node = (page.data.nodeList as any[]).find((n: any) =>
      String(n.class || '').includes('wxs-dyn'),
    );
    expect(!!node).withContext('wxs-dyn 节点没渲染').toBeTrue();

    // setProperty 不拍平，所以这里必须是真数组，wxml 的 property.bar[0] 才取得到
    expect(Array.isArray(node.property.bar))
      .withContext(
        `枝叶数组被拍平了 → property.bar=${JSON.stringify(node.property.bar)}`,
      )
      .toBeTrue();
    expect(node.property.bar).toEqual([7]);
  });

  it('带 wxs 的页面事件链仍然通', async () => {
    const page = await pageContext();
    const vm: any = page.__ngComponentInstance;

    expect(vm.on()).toBeFalse();
    await dispatchTap(page, '.wxs-btn');
    expect(vm.on()).toBeTrue();
  });
});
