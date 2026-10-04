/**
 * 此文件仅供测试使用，正常开发不需要。
 *
 * 二级出口的组件同样要有一个 `*.entry.ts` 才会被产成小程序自定义组件，
 * 测试页里的 `<lib-secondary-panel>` 才用得上。它落在 `secondary/`
 * （与 `src` 同级），所以本工程的 `sourceRoot` 得指到 `projects/first`，
 * 否则自动发现扫不到它。
 */
export { SecondaryPanelComponent as default } from './secondary-panel.component';
