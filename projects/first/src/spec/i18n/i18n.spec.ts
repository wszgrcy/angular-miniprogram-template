import { clearTranslations, loadTranslations } from '@angular/localize';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { I18nTestComponent } from './i18n-test.component';

const TARGET_PAGE = '/pages/i18n/i18n-test-component-entry';

/**
 * 英文译文表。占位符名必须和编译产物逐字一致，写错不报错，只会静默退回源文案。
 * 名字是编译器生成的，去产物里 grep 反引号包起来的那串最准：
 *
 * ```bash
 * grep -o '`:[^`]*`' dist/vitest/first/pages/i18n/i18n-test-component-entry.js
 * ```
 *
 * 模板插值 → `{$INTERPOLATION}`；ICU 的变量 → `VAR_SELECT` / `VAR_PLURAL`
 * （裸写，不带 `{$}`）；ICU 分支里的插值 → `{INTERPOLATION}`。
 */
const EN: Record<string, string> = {
  'spec.title': 'TITLE',
  'spec.count': '{$INTERPOLATION} item(s)',
  'spec.select': '{VAR_SELECT, select, male {HE} female {SHE} other {THEY}}',
  'spec.plural':
    '{VAR_PLURAL, plural, =0 {NONE} one {ONE} other {{INTERPOLATION} MANY}}',
  'spec.alt': 'photo {$INTERPOLATION}',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function waitLoad() {
  return new Observable<any>((ob) => {
    (wx as any).onAppRoute((result: any) => ob.next(result));
  });
}

async function openPage(url: string) {
  const loaded = waitLoad()
    .pipe(
      filter((item) => item.openType === 'reLaunch'),
      take(1),
    )
    .toPromise();
  // wx.reLaunch 的 fail 是个带一堆原型方法的对象，直接抛出来会刷满屏
  // 无关字段，把真正那句 errMsg 冲掉。先抽成一行。
  await new Promise((res, rej) =>
    wx.reLaunch({
      url,
      success: res,
      fail: (e: any) => rej(new Error(String(e?.errMsg ?? e))),
    }),
  ).catch((e) => {
    throw new Error(`reLaunch ${url} 失败：${String(e?.message ?? e)}`);
  });
  await loaded;
}

async function pageContext() {
  const page: any = getCurrentPages()[0];
  expect(!!page, '页面为空').toBe(true);

  const started = Date.now();
  for (;;) {
    if (page.__ngComponentInstance && page.data.hasLoad) {
      break;
    }
    if (Date.now() - started > 8000) {
      const onLoad = page.__lifeTimePromiseObject?.onLoad;
      const reason = onLoad
        ? await Promise.race([
            onLoad.then(() => 'onLoad ok').catch((e: any) => String(e?.stack || e)),
            new Promise((r) => setTimeout(() => r('onLoad still-pending'), 300)),
          ])
        : 'no onLoad promise';
      throw new Error(`页面没就绪，${reason}`);
    }
    await sleep(50);
  }

  return {
    page,
    vm: page.__ngComponentInstance as I18nTestComponent,
    tree: () => JSON.stringify(page.data.nodeList),
  };
}

/** 断言渲染结果。失败时把节点树片段拼进消息，否则只能看到「不包含某串」 */
function contains(tree: string, needle: string, what: string) {
  expect(tree, `${what}；实际节点树：${tree.slice(0, 900)}`).toContain(needle);
}

/** 改信号后要等变更检测把新文案刷进 data，轮询比固定 sleep 稳 */
async function settle(read: () => string, timeout = 3000): Promise<string> {
  const started = Date.now();
  for (;;) {
    await sleep(80);
    const tree = read();
    if (tree) {
      return tree;
    }
    if (Date.now() - started > timeout) {
      throw new Error(`节点树空了，等不到变更检测落地（${timeout}ms）`);
    }
  }
}

/**
 * 运行时 i18n 的端到端覆盖。
 *
 * 构建绿不代表 i18n 通了：没注入 `@angular/localize/init` 时 `$localize`
 * 退化成恒等实现，ICU 分支不解析，页面上直接登 `{VAR_SELECT, select, ...}`
 * 原文，构建一个字都不提。这里四条消息各钉一条产物路径。
 */
describe('运行时 i18n', () => {
  beforeAll(async () => {
    clearTranslations();
    loadTranslations(EN);
    await openPage(TARGET_PAGE);
  });

  afterAll(() => clearTranslations());

  it('静态消息取到译文', async () => {
    const { tree } = await pageContext();
    contains(tree(), 'TITLE', '静态 i18n 没取到译文');
  });

  it('带插值的消息取到译文并填对占位符', async () => {
    const { tree } = await pageContext();
    contains(tree(), '0 item(s)', '{$INTERPOLATION} 没被替换');
  });

  it('i18n-alt 属性消息跟着插值走', async () => {
    const { tree } = await pageContext();
    contains(tree(), 'photo 0', 'i18n-alt 没翻译或占位符没填');
  });

  it('ICU select 按变量选分支', async () => {
    const { vm, tree } = await pageContext();
    contains(tree(), 'THEY', 'gender=other 没走 other 分支');

    vm.gender.set('male');
    contains(await settle(tree), 'HE', 'gender=male 没走 male 分支');
  });

  it('ICU plural 按数量选分支，分支内插值也求值', async () => {
    const { vm, tree } = await pageContext();
    contains(tree(), 'NONE', 'count=0 没走 =0 分支');

    vm.count.set(1);
    contains(await settle(tree), 'ONE', 'count=1 没走 one 分支');

    vm.count.set(3);
    contains(await settle(tree), '3 MANY', 'other 分支里的 {INTERPOLATION} 没求值');
  });
});
