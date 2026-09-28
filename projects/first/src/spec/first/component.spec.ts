import { Injector } from '@angular/core';
import { ComponentFinderService } from 'angular-miniprogram';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
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
describe('first', () => {
  beforeEach(async () => {
    // 已经在目标页就不用再跳（小程序启动进来就是这一页）
    const current = getCurrentPages()[0];
    if (current && current.route === TARGET_PAGE.slice(1)) {
      return;
    }

    // 必须**先订阅再跳转**。onAppRoute 是事件流，不会重发历史，
    // 等 reLaunch 完了再去注册，路由事件早就发出去了，
    // 这个 await 会一直挂到 jasmine 10s 超时。
    const loaded = waitLoad()
      .pipe(
        filter((item) => item.openType === 'reLaunch'),
        take(1)
      )
      .toPromise();

    await new Promise((res, rej) =>
      wx.reLaunch({
        url: TARGET_PAGE,
        success: res,
        fail: rej,
      })
    );
    await loaded;
  });

  it('main', async () => {
    let page = getCurrentPages()[0];
    expect(page).toBeTruthy('页面为空');
    let firstTestComponent: FirstTestComponent = page.__ngComponentInstance;
    let firstComponent = firstTestComponent.firstComponent;
    let injector: Injector = page.__ngComponentInjector;
    let componentFinderService = injector.get(ComponentFinderService);

    // ComponentFinderService.get() 是 async，返的是 Promise 不是 Observable，
    // 直接 .pipe() 会报 wxComponent.pipe is not a function
    const wxComponent: WechatMiniprogram.Component.Instance<
      WechatMiniprogram.IAnyObject,
      WechatMiniprogram.IAnyObject,
      WechatMiniprogram.IAnyObject
    > = await componentFinderService.get(firstComponent);
    expect(wxComponent).toBeTruthy('拿不到对应的微信组件实例');

    await new Promise((res, rej) => {
      const query = wxComponent.createSelectorQuery();
      query
        .select('.first')
        .boundingClientRect((result) => {
          try {
            expect(result).toBeTruthy('节点不存在');
            expect((result as WechatMiniprogram.BoundingClientRectCallbackResult).height).toBeGreaterThan(0);
            res(undefined);
          } catch (e) {
            rej(e);
          }
        })
        .exec();
    });
  });
});
