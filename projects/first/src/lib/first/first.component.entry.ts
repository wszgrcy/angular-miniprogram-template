/**
 * 此文件仅供测试使用，正常开发不需要。
 *
 * 组件入口靠 default export 声明绑定哪个组件，`componentRegistry`
 * 由构建器生成。测试页里 `<lib-first>` 要能用，前提是这个组件被产成
 * 小程序自定义组件 —— 而 sourceRoot 下的 `*.entry.ts` 就是判定依据。
 */
export { FirstComponent as default } from './first.component';
