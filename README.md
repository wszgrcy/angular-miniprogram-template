# AngularMiniprogramTemplate

Angular 开发小程序（微信 / 支付宝 / 百度 / QQ …）的初始化模板。

当前基线：**Angular 22.1.x + angular-miniprogram 2.x + TypeScript 6.0 + ng-packagr 22**。

## 环境

- Node `^22.22.3 || ^24.15.0`（Angular 22 的 engines 要求）
- 微信开发者工具（跑 `ng test` 时需要）

## 命令

| 命令                  | 说明                                     |
| --------------------- | ---------------------------------------- |
| `npm run build:lib`   | 构建示例库 `first`（应用依赖它的产物）   |
| `npm run build`       | 构建小程序（development）                |
| `npm run build:prod`  | 构建小程序（production）                 |
| `npm start`           | `ng build --watch`                       |
| `npm run test:lib`    | 只起 karma server（需自己拉开发者工具）  |
| `npm run test:wechat` | 一键跑小程序 karma 测试（推荐）          |

产物在 `dist/angular-miniprogram-template`，用微信开发者工具打开该目录即可。

> `build` 之前必须先 `build:lib`：`tsconfig.json` 的 `paths` 把 `first`
> 指到 `dist/first`，库没构建的话应用编译会找不到模块。

## 五个 Demo 对应哪些文件

模板里放了 5 个 demo，各自的文件如下。

### Demo 1：小程序基础演示（`@if` / `@for` + signal）

| 文件 | 作用 |
| --- | --- |
| `src/pages/home/home.component.ts` | signal / computed / 派生列表，inc·reset·togglePanel·cycleMode |
| `src/pages/home/home.component.html` | `@if`/`@else if`/`@else`、`@for`+`@empty`、`@switch` |
| `src/pages/home/home.entry.ts` | `bootstrapPage(HomeComponent)` —— 页面入口 |
| `src/pages/home/home.entry.json` | 页面配置（导航栏标题等） |

### Demo 2：组件库一级 / 二级出口

库侧（`projects/first`）：

| 文件 | 作用 |
| --- | --- |
| `projects/first/src/lib/first/first.component.ts` | **一级出口**组件 `FirstComponent`（`@Input title` / `@Output changed` / signal `count` / `inc()`） |
| `projects/first/src/lib/first/first.service.ts` | 一级出口服务 `FirstService`（`tag` / `hits` signal / `touch()`） |
| `projects/first/src/public-api.ts` | 一级出口 barrel |
| `projects/first/secondary/ng-package.json` | **二级出口**声明（独立 entry point） |
| `projects/first/secondary/index.ts` | 二级出口 barrel |
| `projects/first/secondary/secondary-panel.component.ts` | 二级出口组件 `SecondaryPanelComponent` |
| `projects/first/secondary/secondary.service.ts` | 二级出口自带服务 `SecondaryService` |

使用侧：

| 文件 | 作用 |
| --- | --- |
| `src/pages/library/library.component.ts` | 同时引 `first` 与 `first/secondary`，父传子 / 子抛父 / 服务共享 |
| `src/pages/library/library.component.html` | 两个库组件的用法 |
| `src/pages/library/library.entry.ts` / `.entry.json` | 页面入口与配置 |
| `tsconfig.json` → `paths` | `first` → `./dist/first`，`first/secondary` → `./dist/first/secondary` |

> 二级出口目录放在 `projects/first/secondary`（和 `src` **同级**），不是
> `src/secondary`。ng-packagr 按「主 `ng-package.json` 所在目录的相对路径」
> 给 entry 命名，放 `src/` 里会产成 `first/src/secondary` 这种名字。

### Demo 3：WXS

| 文件 | 作用 |
| --- | --- |
| `src/pages/wxs/format.wxs` | WXS 模块：`money` / `thousands` / `pad` / `truncate` / `cls` + 常量 |
| `src/pages/wxs/wxs.component.html` | `<wxs module="fmt" src="./format.wxs">` 声明 + 调用 |
| `src/pages/wxs/wxs.component.ts` | `NO_ERRORS_SCHEMA`（`<wxs>` 与 `fmt.xxx` 不是 Angular 实体） |
| `src/pages/wxs/wxs.entry.ts` / `.entry.json` | 页面入口与配置 |

> `src` 路径**相对组件源文件**写，不支持内联 WXS。WXS 里不能用
> `async` / `class` / `try-catch` / `import` / 模板字符串插值。

### Demo 4：自定义 tabBar

| 文件 | 作用 |
| --- | --- |
| `src/custom-tab-bar/index.ts` | `bootstrapCustomTabbar(TabbarComponent)`。**入口必须是 `index`**（微信硬性要求），且**必须用 `bootstrapCustomTabbar`**，见下 |
| `src/custom-tab-bar/tabbar.component.ts` | tab 列表 + 选中态 + 点击切页 |
| `src/custom-tab-bar/tabbar.component.scss` | 样式 |
| `src/services/tabbar.state.ts` | `TabbarState`：root provider + signal，跨 4 个 tab 页共享选中态 |
| `src/app.config.json` → `tabBar` | `"custom": true` + `list`（`list` 的 `pagePath` 要和 `TabbarState.items` 对齐） |

> 自定义 tabBar 在**每个 tab 页各挂一个组件实例**，所以选中态必须放到
> 外部 root provider 里，页面 `ngOnInit` 调 `markActive(i)`。
>
> **为什么不能用 `componentRegistry`**：那条路上小程序组件实例是靠父模板传
> `nodePath` / `nodeIndex` 两个 property 回连 Angular 的。而自定义 tabBar 的
> 实例是微信框架自己创建的，没人传路径 → 永远连不上 → `hasLoad` 恒为
> `false` → `wx:if="{{hasLoad}}"` 渲染出一个**空盒子，且不报错**。
>
> 另：只有需要盖在 `canvas` / `video` / `map` 这类原生组件上时才需要
> `cover-view`；普通页面用 `view` 即可。

### Demo 5：分包

| 文件 | 作用 |
| --- | --- |
| `src/app.config.json` → `subpackages` | 分包声明：`root: "packageA"` + 两个页面 |
| `src/app.config.json` → `preloadRule` | 进分包入口页时预下载 `packageA` |
| `src/pages/subpkg/*` | 主包里的「跳分包」入口页 |
| `src/packageA/pages/goods/*` | 分包页 1 |
| `src/packageA/pages/order/*` | 分包页 2 |
| `angular.json` → `build.options.appJson` | **分包必须走 `appJson`**，见下 |

> 分包只在 builder 配了 `appJson` 时才会被解析并挂上分包插件。
> 把静态 `app.json` 当 asset 拷进去，构建器对分包是零感知的 ——
> 产物里页面全在主包。`appJson` 与 assets 里的静态 `app.json` **互斥**。
>
> 约定：分包根目录既是源码目录也是产物目录，`src/packageA/**` → `packageA/**`。

### 共用文件

| 文件 | 作用 |
| --- | --- |
| `src/main.ts` | `bootstrapApplication()`，app 级 provider |
| `src/app.config.json` | 结构化 app 配置（pages / entryPagePath / window / tabBar / subpackages / preloadRule） |
| `src/styles.scss` | 全局共用样式（`.page` / `.card` / `.btn` / `.panel` / `.tip` / `.row` / `.empty`） |
| `src/components/component1/*` | 自定义组件（`*.entry.ts`）示例 |

### 命名约定

- 页面 / 组件入口一律 `*.entry.ts`，产物名由源文件名推导：
  `home.entry.ts` → `pages/home/home-entry`。
- 组件入口放 `src/components/**`，在 `angular.json` 的 `components` 里配 pattern。
- `custom-tab-bar` 是唯一例外：入口必须叫 `index.ts`。

## 入口与启动页

小程序没有路由表，「进哪个页面」由三样东西共同决定，缺一处就没入口：

| 层 | 文件 | 作用 |
| --- | --- | --- |
| 启动页 | `app.config.json` → `entryPagePath` | 冷启动进哪个页；不填则用 `pages[0]` |
| 页面清单 | `app.config.json` → `pages` / `subpackages` | 声明页面路径，要逐字对上产物路径 |
| 页面入口 | `src/pages/xxx/xxx.entry.ts` | `bootstrapPage(XxxComponent)`，被 `pages` pattern 编进来 |

加一个页面：

1. `src/pages/xxx/xxx.component.ts`（standalone）+ `xxx.entry.ts`（`bootstrapPage`）；
2. `app.config.json` 的 `pages` 里加 `pages/xxx/xxx-entry`；
3. 确认目录被 `angular.json` 的 `build.options.pages` pattern 覆盖
   （模板默认只盖 `src/pages` 与 `src/packageA`，新目录得自己补一条）。

改启动页：改 `entryPagePath` 就行，不用把目标页挑到 `pages[0]`。

页面之间怎么跳：tab 页一律由 **tabBar 配置**承担（改入口就改 `tabBar.list` /
`entryPagePath`，不要往页面里塞按钮）；非 tab 页才用 API：

| 目标 | API |
| --- | --- |
| tabBar 页 | `wx.switchTab({ url })`（`navigateTo` 到 tabBar 页会失败） |
| 普通页 / 分包页 | `wx.navigateTo({ url })`，分包页首次进入会先下载分包（模板里入口在「分包」页） |
| 任意页且清空页面栈 | `wx.reLaunch({ url })` |

`appJson` 生效时，构建期会直接拦下这几类「配了但进不去」：

- `pages` / 分包里声明了，但本次构建没产出对应入口（漏 `*.entry.ts`，
  或目录不在 `pages` pattern 范围内）
- `entryPagePath` 指向未声明的页面
- `tabBar.pagePath` 指向分包页 / 未声明页

## 关于 `angular-miniprogram` 的接入方式

`package.json` 里现在是 **tgz 本地包**：

```json
"angular-miniprogram": "file:../angular-miniprogram/dist/angular-miniprogram-2.0.2.tgz"
```

要换成 npm 版本就直接改版本号：

```json
"angular-miniprogram": "^2.0.0"
```

### 改完库怎么重新接入

```bash
# 1. 源码项目 build
cd ../angular-miniprogram && npm run build

# 2. 打包成 tgz（dist 本身就是完整包目录）
cd dist && npm pack

# 3. 模板项目重装
cd ../../angular-miniprogram-template
npm install "C:/code/my-project/angular-miniprogram/dist/angular-miniprogram-2.0.2.tgz"
```

### 为什么不用 `file:../angular-miniprogram/dist`（指向目录）

npm 会把这种写法装成 **symlink**，realpath 落在源码项目里。Node 解析依赖时
顺着 realpath 往上走，命中的是**源码项目的 `node_modules`**，于是：

1. **`@angular/core` 被打成两份**（模板一份 + 源码项目一份）。两份各自持有
   自己的注入上下文变量，运行时：

   ```
   NG0203: The `EnvironmentInjector` token injection failed.
   ```

   页面 `onLoad` 直接挂掉，`hasLoad` 永远是 `false`，页面白屏。

2. **掩盖库自身 `dependencies` 漏报的 bug**。软链能“意外”解析到源码项目
   独有的包，装成真实包就炸。

> `angular.json` 里有个 `dedupe` 选项可以强制单例包。**不要用它绕软链**，
> 那是治标不治本。用 tgz 就不需要。

自查产物里有没有被打成两份：

```bash
# 每个符号只应该命中 1 个文件
grep -l "function injectInjectorOnly" dist/angular-miniprogram-template/*.js
grep -l "var StandaloneService"     dist/angular-miniprogram-template/*.js
```

命中 2 个文件就是重复了。

## ng22 迁移要点（相对 ng17 模板）

模板代码跟着库的新 API 改了，写新页面时注意：

1. **不再有启动 NgModule**。`src/main.ts` 用 `bootstrapApplication()`，
   `MainModule` / `MiniProgramModule` 已删除。
   要加 app 级 provider 就传配置：`bootstrapApplication({ providers: [...] })`。
2. **页面用 standalone 组件 + `bootstrapPage`**，不再需要 `xxx.module.ts`：

   ```ts
   // page1.component.ts
   @Component({ standalone: true, imports: [CommonModule, ...], ... })
   export class Page1Component {}

   // page1.entry.ts
   import { bootstrapPage } from 'angular-miniprogram';
   bootstrapPage(Page1Component);
   ```

   旧的 `pageStartup(Module, Component)` 仍可用但已 `@deprecated`。
3. **`angular-miniprogram/common` 这个入口没了**，直接用 `@angular/common`。
4. **不再引 `zone.js`**，链路已 zoneless。
5. **TS 6.0**：`strict` 默认开启、`baseUrl` / `moduleResolution: node` 等
   被标废弃，根 `tsconfig.json` 里显式写了 `ignoreDeprecations: "6.0"`，
   `moduleResolution` 换成 `bundler`（Angular 21 起 core 的裸子路径导入
   需要 exports map）。

## 跑 `first` 库的测试

`npm run test:lib` 会：

1. 用 Vite 把测试小程序打到 `dist/karma/first`
   （**不要**把 `outputPath` 配成 `dist` 根，`emptyOutDir` 会把
   `dist/first` 删掉，应用就编不出来了）
2. 起 karma server（9876），等小程序客户端连上来

测试链路本身是通的，但 karma 的 launcher 是占位实现，**不会**自己拉起
开发者工具。模板自带了一键执行器把两端串起来：

```bash
npm run test:wechat
# 等价于 node ./scripts/wechat-karma.cjs --target first
```

它做的事：预检登录态 → 关掉残留自动化窗口 → 清 karma 端口 →
起 `ng test` → `cli auto` 拉起产物 → 抓日志判定 → 收尾杀进程树。
跑完出 `[PASS] Executed 5 of 5 SUCCESS`，退出码 0，可直接进 CI。

当前 karma 覆盖的用例（`projects/first/src/spec/first/component.spec.ts`）：

1. 一级出口组件渲染，并能用 `createSelectorQuery().select('.lib-first')` 查到节点
2. 二级出口组件渲染，同样能 `select('.lib-secondary')` 查到
3. signal 驱动组件状态，`@Output` 能抛到父组件
4. 二级出口 computed + 自带服务可用

> **`select` 查询是可用的**：先 `ComponentFinderService.get(ngInstance)` 拿到
> 对应的微信组件实例，再 `wxComponent.createSelectorQuery().select(...)`。
> 注意 `ComponentFinderService.get()` 返的是 **Promise**，不是 Observable，
> 直接 `.pipe()` 会报 `wxComponent.pipe is not a function`。

前置条件（脚本会预检，不满足直接报错，而不是白等 5 分钟）：

1. 微信开发者工具已启动，且 **设置 → 安全设置 → 服务端口** 已开启
2. 已扫码登录（CLI 自己拉起的实例是登出态，等多久都不会恢复）

常用参数：

| 参数           | 说明                                      |
| -------------- | ----------------------------------------- |
| `--target`     | `ng test` 的目标（默认 `first`）          |
| `--dist`       | 测试产物目录（默认 `dist/karma/<target>`）|
| `--cli`        | 开发者工具 cli 路径（或 `WX_DEVTOOLS_CLI`）|
| `--auto-port`  | 自动化端口（默认 9420）                   |
| `--ide-port`   | IDE 服务端口（不传则读 CLI 记录的值）     |
| `--timeout`    | 等结果上限秒数（默认 180）               |
| `--keep-open`  | 跑完不关开发者工具里的项目窗口            |

失败时会打「失败诊断」块，指出卡在哪个阶段，不用对着日志猜。

> **游客 appid（`touristappid`）实测能跑 CLI 自动化**，不需要真实 AppID。
> 产物里 `setting.urlCheck` 已置为 `false`：测试客户端要用 socket.io 回连
> `127.0.0.1:9876`，开着合法域名校验会被拦。

### 手动方式（调试用）

```bash
# 终端 A：起 karma server（会一直等着）
npm run test:lib

# 终端 B：拉起项目并开自动化
"<安装路径>/cli.bat" auto   --project "<绝对路径>/dist/karma/first" --auto-port 9420
```

或者 GUI：微信开发者工具 → 导入项目 → 选 `dist/karma/first`。

### 端口注意

`KARMA_PORT` 是**编译期**烧进产物的（默认 9876）。如果 9876 已被占用，
karma server 会自己漂到 9877，但产物里仍然连 9876 —— 表现是客户端
连不上、一直卡在 `Starting browser miniprogram`。

`npm run test:wechat` 跑之前会按端口把残留进程清掉，正常不用管；
手动跑的话自己确认一下：

```bash
netstat -ano | grep 9876   # 有残留就先杀
```

要连真机，把 builder 配置里的 `clientHost` 改成开发机的局域网 IP
（默认 `127.0.0.1`；微信模拟器解不了 `localhost`）。

## 模板正文里不能写裸的 `{`

Angular 把模板里的 `{` 当 **ICU 消息** 解析。写示例文案时很容易踩：

```html
<!-- 错：Angular 会报 Invalid ICU message -->
<p>import { FirstService } from 'first'</p>
```

改成下面任意一种：

```html
<p>import &#123; FirstService &#125; from 'first'</p>
<p>{{ '{' }}FirstService{{ '}' }} from 'first'</p>
```

> 这类错误以前会被**静默吞掉**：模板解析失败 → 节点树为空 → wxml 只剩
> 一个空 `<block wx:if="{{hasLoad}}"></block>`，构建绿、页面白屏，日志里
> 一个字都不提。
>
> 现在 builder 会直接报错并给出文件 / 组件 / 行列号，不再静默产出空模板。
