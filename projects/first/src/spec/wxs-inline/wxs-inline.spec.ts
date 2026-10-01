import { filter, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

const TARGET_PAGE = '/pages/wxs-inline/wxs-inline-entry';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const oneLine = (v: unknown) => String(v).split('\n').join(' | ');

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

async function waitFor<T>(
  what: string,
  read: () => T | undefined,
  timeout = 8000,
) {
  const started = Date.now();
  for (;;) {
    const value = read();
    if (value) {
      return value;
    }
    if (Date.now() - started > timeout) {
      throw new Error(`${what} 等待 ${timeout}ms 超时`);
    }
    await sleep(50);
  }
}

function nodeRect(host: any, selector: string): Promise<any> {
  return new Promise((res, rej) => {
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
  });
}

/**
 * inline `template` 的 wxs 下推。
 *
 * `templateUrl` 和 inline 的剥离路径不同（一个扫外部文件，一个从 .ts 里抽
 * 字面量），只测前者会漏掉整条 inline 链路。这里钉住：inline 模板同样要
 * 被剥干净并走 AOT，渲染层的 wxs 同样要真跑过。
 */
describe('WXS inline 模板', () => {
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
      throw new Error('页面为空');
    }
    await waitFor('页面 Angular 实例', () => page.__ngComponentInstance);
    await waitFor('页面 hasLoad', () => (page.data.hasLoad ? true : undefined));
    return page;
  }

  it('inline 模板能 AOT 渲染，逻辑层不引用 fmt', async () => {
    const page = await pageContext();
    expect((page.data.nodeList || []).length).toBeGreaterThan(0);
    expect(JSON.stringify(page.data.nodeList)).not.toContain('fmt');
  });

  it('inline 模板里 wxs 算出的 class 落到节点上', async () => {
    const page = await pageContext();
    await nodeRect(page, '.num-03');
  });
});
