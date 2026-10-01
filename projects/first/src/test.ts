import { bootstrapApplication } from 'angular-miniprogram';
import { startupTest } from 'angular-miniprogram/karma/client';

const jasmineRequire = require('jasmine-core/lib/jasmine-core/jasmine.js');

function bootWithoutGlobals() {
  let jasmineInterface;
  const jasmine = jasmineRequire.core(jasmineRequire);
  const env = jasmine.getEnv({ suppressLoadErrors: true });
  jasmineInterface = jasmineRequire.interface(jasmine, env);

  return jasmineInterface;
}

const obj = bootWithoutGlobals();
for (const key in obj) {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    (wx as any).__global[key] = obj[key];
  }
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

describe('describe1', () => {
  it('it1', () => {
    console.log('main');
    expect(true).toBe(true);
  });
});

bootstrapApplication().catch((e) => {
  // karma 的 progress reporter 不透传 console，把错误挂到 wx 上让 spec 能断出来
  (wx as any).__bootstrapError = String(e?.stack ?? e);
  console.error(e);
});

// Then we find all the tests.
const context = (require as any).context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);

// ng 改了 test 实例的获取时机：网页端是 spec -> component，小程序这边两者是平行的，
// 启动动作必须排在 spec 全部加载完之后，所以这里延时一下再 startupTest()。
setTimeout(() => {
  startupTest();
}, 1000);
