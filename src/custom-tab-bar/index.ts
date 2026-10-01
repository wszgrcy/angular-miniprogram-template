/**
 * 自定义 tabBar 的启动入口。
 *
 * 两个硬性约定（微信侧）：
 * 1. 目录/文件名必须是 `custom-tab-bar/index`，产物路径由源文件名推导；
 * 2. `app.config.json` 里 `tabBar.custom: true` 且 `list` 完整保留
 *    ——`list` 不参与渲染，但微信靠它识别哪些页是 tab 页。
 *
 * 必须用 `bootstrapCustomTabbar`，**不能用 `componentRegistry`**：
 * 后者的小程序实例靠父模板传 `nodePath` / `nodeIndex` 回连 Angular，
 * 而 tabbar 组件是微信框架自己创建的，没人传路径 → 永远连不上 →
 * `hasLoad` 恒为 `false` → tab 栏位置渲染成空白，且不报错。
 */
import { bootstrapCustomTabbar } from 'angular-miniprogram';
import { CustomTabbarComponent } from './tabbar.component';

bootstrapCustomTabbar(CustomTabbarComponent);
