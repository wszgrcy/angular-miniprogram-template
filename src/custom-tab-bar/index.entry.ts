/**
 * 自定义 tabBar 的入口。
 *
 * 两个硬性约定（微信侧）：
 * 1. 产物必须落在 `custom-tab-bar/index`。源目录固定 `<sourceRoot>/custom-tab-bar`，
 *    文件名里的 `.entry` 让位给平台写死的 `index` → `index.entry.ts` → `custom-tab-bar/index`；
 * 2. `app.config.json` 里 `tabBar.custom: true` 且 `list` 完整保留
 *    ——`list` 不参与渲染，但微信靠它识别哪些页是 tab 页。
 *
 * 入口类型由构建器按位置判定（产物落在平台的 tabBar 目录 → 自定义 tabBar），
 * 它替我们生成 `bootstrapCustomTabbar`。这里只声明绑定哪个组件。
 *
 * 为什么必须是 `bootstrapCustomTabbar` 而不是普通组件：后者靠父模板传
 * `nodePath` / `nodeIndex` 回连 Angular，而 tabbar 组件是微信框架自己创建的，
 * 没人传路径 → 永远连不上 → `hasLoad` 恒为 `false` → tab 栏位置渲染成空白且不报错。
 */
export { CustomTabbarComponent as default } from './tabbar.component';
