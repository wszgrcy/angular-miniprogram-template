import { Injector } from '@angular/core';
import { ComponentFinderService } from 'angular-miniprogram';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { FirstTestComponent } from './first-test.component';
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
    await new Promise((res, rej) =>
      wx.reLaunch({
        url: `/pages/first/first-test-component-entry`,
        success: res,
        fail: rej,
      })
    );
    await waitLoad()
      .pipe(
        filter((item) => item.openType === 'reLaunch'),
        take(1)
      )
      .toPromise();
  });

  it('main', async () => {
    let page = getCurrentPages()[0];
    expect(page).toBeTruthy('页面为空');
    let firstTestComponent: FirstTestComponent = page.__ngComponentInstance;
    let firstComponent = firstTestComponent.firstComponent;
    let injector: Injector = page.__ngComponentInjector;
    let componentFinderService = injector.get(ComponentFinderService);
    let wxComponent = componentFinderService.get(firstComponent);
    expect(true).toBe(true);
    await new Promise((res) => {
      wxComponent
        .pipe(take(1))
        .subscribe(
          (
            page: WechatMiniprogram.Page.Instance<
              WechatMiniprogram.IAnyObject,
              WechatMiniprogram.IAnyObject
            >
          ) => {
            const query = page.createSelectorQuery();
            let nodeRef = query.select('.first');
            expect(nodeRef).toBeTruthy();
            nodeRef
              .boundingClientRect((result) => {
                expect(result.height).toBeGreaterThan(0);
                res(undefined);
              })
              .exec();
          }
        );
    });
  });
});
