/**
 * 二级出口入口（消费方写法：`import { ... } from 'first/secondary'`）。
 *
 * 一个 ng-packagr 目录 + 一个 `ng-package.json` 就是一个独立 entry point：
 *   一级 → dist/first/fesm2022/first.mjs
 *   二级 → dist/first/fesm2022/first-secondary.mjs
 * 两者各自打包、各自带组件元数据，主构建按「组件名」分别对上，
 * 产物落在 library/first/... 与 library/first/secondary/... 两个不同目录。
 */
export * from './secondary.service';
export * from './secondary-panel.component';
