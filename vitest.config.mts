import { miniProgramVitest } from 'angular-miniprogram/vitest';
import { defineConfig } from 'vitest/config';

/**
 * 小程序运行时测试（vitest 链路）。
 *
 * spec 不在本进程跑：它们被 `ng run first:test` 编进小程序产物，由开发者工具
 * 里的小程序运行时执行，宿主只负责调度与收结果。
 *
 * 一条命令搞定：`npm run test:wechat`（编产物 → 起 vitest → 开项目 → 收结果）。
 * 手动分步是：
 *   1. npm run test:build          # 把 spec 编进 dist/vitest/first
 *   2. npx vitest run              # 起 WS，等设备连入
 *   3. 开发者工具打开 dist/vitest/first
 *
 * 端口必须和 angular.json 里 `first.test.options.port` 一致，否则产物连 A、
 * 宿主在 B，永远连不上。`scripts/wechat-vitest.cjs` 会把 `--port` 透成
 * `MP_VITEST_PORT` 两边一起改。
 */
const port = Number(process.env.MP_VITEST_PORT ?? 17900);

/**
 * 等设备连回的毫秒数。脚本会把自己的 `--connect-timeout`（默认 20s）透过来，
 * 两边共用一个数；手跑 vitest 时退回这里的默认值。
 */
const connectTimeout = Number(process.env.MP_VITEST_CONNECT_TIMEOUT ?? 20_000);

export default defineConfig({
  plugins: [miniProgramVitest({ port, connectTimeout })],
  test: {
    // 没写 `globals` —— `miniProgramVitest()` 默认就开了（设备端靠它
    // registerApiGlobally，裸 describe/it/expect 才存在）。
    // 这里只是把「有哪些文件」告诉 vitest 的调度器。
    include: ['projects/first/src/spec/**/*.spec.ts'],
    // 设备端是一个常驻运行环境，串行跑，别并发抢同一个 slot。
    maxWorkers: 1,
    isolate: false,
    // 上限，不是性能预算：卡住了就早断，别留一句没头没尾的 `Test timed out`。
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
