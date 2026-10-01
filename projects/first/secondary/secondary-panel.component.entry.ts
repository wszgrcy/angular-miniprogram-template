/**
 * 此文件仅供 karma 测试使用，正常开发不需要。
 *
 * karma 的 `components` 模式按 `*.entry.ts` 把组件产成小程序自定义组件，
 * 二级出口的组件同样要这么注册一次才能被测试页用上。
 */
import { componentRegistry } from 'angular-miniprogram';
import { SecondaryPanelComponent } from './secondary-panel.component';

componentRegistry(SecondaryPanelComponent);
