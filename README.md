# AngularMiniprogramTemplate

Angular 开发小程序（微信 / 支付宝 / 百度 / QQ …）的初始化模板。

当前基线：**Angular 22.1.x + angular-miniprogram 2.x + TypeScript 6.0 + ng-packagr 22**。

## 环境

- Node `^22.22.3 || ^24.15.0`（Angular 22 的 engines 要求）
- 微信开发者工具（跑 `npm run test:wechat` 时需要）

## 命令

| 命令                  | 说明                                     |
| --------------------- | ---------------------------------------- |
| `npm run build:lib`   | 构建示例库 `first`（应用依赖它的产物）   |
| `npm run build`       | 构建小程序（development）                |
| `npm run build:prod`  | 构建小程序（production）                 |
| `npm start`           | `ng build --watch`                       |
| `npm run test:build`  | 只把 spec 编成测试小程序产物（不起 vitest）|
| `npm run test:wechat` | 一键跑小程序运行时测试（vitest，推荐）  |
| `npm run typecheck`   | `tsc -b`，按 references 逐工程做类型检查  |

产物在 `dist/angular-miniprogram-template`，用微信开发者工具打开该目录即可。

> `build` 之前必须先 `build:lib`：`tsconfig.base.json` 的 `paths` 把 `first`
> 指到 `dist/first`，库没构建的话应用编译会找不到模块。

## tsconfig 怎么摆的

根 `tsconfig.json` 是 **solution 式**的：`files: []`，本身不编译任何东西，
只 `references` 三个工程。共享选项全部在 `tsconfig.base.json`。

```
tsconfig.json                 solution：只有 files:[] + references
tsconfig.base.json            共享 compilerOptions / angularCompilerOptions / paths

tsconfig.app.json             应用构建配置（angular.json 指它）
tsconfig.app.check.json       应用类型检查（+ composite）

projects/first/tsconfig.lib.json        库构建配置（ng-packagr 用）
projects/first/tsconfig.lib.check.json  库类型检查
projects/first/tsconfig.spec.json       测试构建配置（first.test 指它）
projects/first/tsconfig.spec.check.json 测试类型检查
```

**为什么构建配置和检查配置要分开：**`tsc -b` 要求被引用的工程
`composite: true`，而 composite 不允许 `declaration: false`；analog 插件对非 lib
构建又**强制** `declaration: false`。同一个文件里摆不下，所以
`composite` 只放在 `*.check.json` 里，构建配置保持干净。

新增工程时：写个构建配置，再写个 `*.check.json`，根 `tsconfig.json` 补一行
references。漏了 references 就等于这个工程不在任何类型检查范围内。

> `tsc -b` 只查 TS，不查模板（`strictTemplates` 那套要 `ng build`）。
> 产物落在 `out-tsc/`（已 gitignore），不会碰到 `dist/`。

## 六个 Demo 对应哪些文件

模板里放了 6 个 demo，各自的文件如下。

### Demo 1：小程序基础演示（`@if` / `@for` + signal）

| 文件 | 作用 |
| --- | --- |
| `src/pages/home/home.component.ts` | signal / computed / 派生列表，inc·reset·togglePanel·cycleMode |
| `src/pages/home/home.component.html` | `@if`/`@else if`/`@else`、`@for`+`@empty`、`@switch` |
| `src/pages/home/home.entry.ts` | `export { HomeComponent as default }` —— 页面入口 |
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
| `tsconfig.base.json` → `paths` | `first` → `./dist/first`，`first/secondary` → `./dist/first/secondary` |

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

### Demo 6：多语言（运行时 i18n）

| 文件 | 作用 |
| --- | --- |
| `angular.json` → `build.options.polyfills` | `["@angular/localize"]`：构建器据此注入 `@angular/localize/init`，挂上全局 `$localize` |
| `tsconfig.app.json` → `compilerOptions.types` | 加 `@angular/localize/init`，让 `$localize` 在 TS 里有类型 |
| `src/services/locale.ts` | 译文表 + `applyLocale` / `readStoredLocale`（`loadTranslations` / `clearTranslations`） |
| `src/main.ts` | bootstrap **之前** `applyLocale(readStoredLocale())` |
| `src/pages/i18n/*` | `i18n` 静态文案、插值、ICU `select`/`plural`、`i18n-*` 属性、TS 里直接用 `$localize` |

要点（都在 `src/services/locale.ts` 的注释里）：

- 消息一律用 `i18n="@@xxx"` 显式命名，译文表的 key 就是 `xxx`。
  不命名则由编译器按文案算哈希，改一个字 id 就变。
- 译文里的占位符名必须与编译产物逐字一致，写错**不报错**、只静默退回源文案。
  名字去产物里 grep：`grep -o '`:[^`]*`' dist/<app>/pages/i18n/i18n-entry.js`。
- 生效时机：模板文案的译文在组件 `consts` 首次求值时定死，`consts` 每个组件
  类型只求一次。所以译文必须在该组件**首次渲染之前**就位（本页靠 `main.ts`），
  运行中切换只对没渲染过的组件生效，已渲染的要重启小程序。

### 共用文件

| 文件 | 作用 |
| --- | --- |
| `src/main.ts` | `bootstrapApplication()`，app 级 provider |
| `src/services/locale.ts` | Demo 6 的译文表与语言切换 |
| `src/app.config.json` | 结构化 app 配置（pages / entryPagePath / window / tabBar / subpackages / preloadRule） |
| `src/styles.scss` | 全局共用样式（`.page` / `.card` / `.btn` / `.panel` / `.tip` / `.row` / `.empty`） |
| `src/components/component1/*` | 自定义组件（`*.entry.ts`）示例 |

### 命名约定

- 页面 / 组件入口一律 `*.entry.ts`，产物名由源文件名推导：
  `home.entry.ts` → `pages/home/home-entry`。
- 入口文件只声明「绑定哪个组件」，写法是 **default export**；
  `bootstrapPage` / `componentRegistry` / `bootstrapCustomTabbar` 由构建器生成，
  业务代码里不出现框架 API。没有 default export 的入口直接构建失败。
- **组件不需要在 `angular.json` 里声明范围**：sourceRoot 下剩下的 `*.entry.ts`
  全当组件，产物路径按 sourceRoot 镜像。前提是它们被 `tsConfig` 的编译单元覆盖
  （`tsconfig.app.json` 的 `include` 是 `src/**/*.ts`）。
- `custom-tab-bar` 是唯一目录写死的：源目录固定 `<sourceRoot>/custom-tab-bar`，
  入口 `index.entry.ts` → 产物 `custom-tab-bar/index`。

## 入口与启动页

小程序没有路由表，「进哪个页面」由三样东西共同决定，缺一处就没入口：

| 层 | 文件 | 作用 |
| --- | --- | --- |
| 启动页 | `app.config.json` → `entryPagePath` | 冷启动进哪个页；不填则用 `pages[0]` |
| 页面清单 | `app.config.json` → `pages` / `subpackages` | 声明页面路径，要逐字对上产物路径 |
| 页面入口 | `src/pages/xxx/xxx.entry.ts` | default export 组件类，被 `pages` pattern 编进来 |

加一个页面：

1. `src/pages/xxx/xxx.component.ts`（standalone）+ `xxx.entry.ts`（default export）；
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
5. **TS 6.0**：`baseUrl` / `moduleResolution: node` 等被标废弃，
   `tsconfig.base.json` 里 `moduleResolution` 用 `bundler`（Angular 21 起
   core 的裸子路径导入需要 exports map）。

## 跑 `first` 库的测试

测试跑在**真·小程序运行时**里，用 vitest。spec 不在 Node 进程里执行：它们被编进
测试小程序产物，由开发者工具里的小程序运行时跑，宿主只负责调度和收结果。

```bash
npm run test:wechat
# 等价于 node ./scripts/wechat-vitest.cjs \
#   --project . --dist ./dist/vitest/first --target first:test
```

它做的事：预检开发者工具服务端口 → `ng run first:test` 编产物 → 后台起 vitest
（内部起 WS server）→ `cli auto` 打开产物目录 → 设备连回来开跑 → 透传输出与退出码。

跑完是 `Test Files 4 passed (4) / Tests 18 passed (18)`，退出码 0，可直接进 CI。
实测整轮 14s。

### 连接方向

设备端 `wx.connectSocket` **主动连出** `ws://<clientHost>:<port>`，宿主只监听。
所以不需要 launcher，也不需要自动化客户端 —— 把项目打开就够了。

端口在两个地方，必须一致，否则产物连 A、宿主在 B，永远连不上：

| 位置                          | 键            | 默认  |
| ----------------------------- | ------------- | ----- |
| `angular.json`                | `…test.options.port` | 17900 |
| `vitest.config.mts`           | `MP_VITEST_PORT`     | 17900 |

`scripts/wechat-vitest.cjs --port` 会把同一个数同时透给两边。自己分开跑的时候
别让它们错开 —— 表现是宿主一直卡在「等设备连入」，然后一句 `connect timeout`。

### 当前覆盖的用例

| 文件 | 钉住什么 |
| --- | --- |
| `spec/first/component.spec.ts` | 一级/二级出口渲染、`select` 查询、signal + `@Output`、wxml 事件链、`@for` 内事件命中对应那一项 |
| `spec/wxs/wxs.spec.ts` | `templateUrl` 里的 wxs 被剥到渲染层并真的执行；property 绑定不被拍平 |
| `spec/wxs-inline/wxs-inline.spec.ts` | inline `template` 的 wxs 下推（和 `templateUrl` 是两条剥离路径，只测前者会漏整条 inline 链路） |
| `spec/i18n/i18n.spec.ts` | 运行时 i18n：静态消息、带插值的消息、ICU 的 select / plural 分支、`i18n-alt` 属性消息 |

> i18n spec 能跑起来的前提是 `angular.json` 里 `first.test.options.polyfills`
> 声明了 `@angular/localize`。不声明时 `$localize` 是 core 的恒等实现，ICU
> 分支不解析，页面上直接登 `{VAR_SELECT, select, ...}` 原文 —— 构建一个字都不提。

> **`select` 查询是可用的**：先 `ComponentFinderService.get(ngInstance)` 拿到
> 对应的微信组件实例，再 `wxComponent.createSelectorQuery().select(...)`。
> 注意 `ComponentFinderService.get()` 返的是 **Promise**，不是 Observable。

### 加一个 spec

1. 在 `projects/first/src/spec/<名字>/` 下放三件套：
   `<名字>.entry.ts`（页面入口，`export default` 页面组件）、`<名字>.entry.json`、
   `<名字>.spec.ts`
2. `angular.json` 的 `first.test.options.pages` 已经用 `**/*.entry.ts` 通配整个
   `src/spec`，加目录不用改配置
3. `vitest.config.mts` 的 `test.include` 同样是 `**/*.spec.ts` 通配，不用动

builder 会自己扫 `sourceRoot` 下的 spec（日志里「发现 N 个 spec」那行就是它），
漏了页面入口会直接报「没声明入口组件」，不会静默少跑。

### 手动方式（调试用）

```bash
# 终端 A：编产物 + 起 vitest，等设备连入
npm run test:build
npx vitest run

# 终端 B：用开发者工具打开产物目录
# 注意用 auto 不是 open —— `cli open` 对游客 appid 直接报 code 10
"<安装路径>/cli.bat" auto --project "<绝对路径>/dist/vitest/first" --auto-port 9420
```

或者 GUI：微信开发者工具 → 导入项目 → 选 `dist/vitest/first`。

### 前置条件

1. 微信开发者工具已启动，且 **设置 → 安全设置 → 服务端口** 已开启
2. 真实 AppID 需要已扫码登录；游客 appid（`touristappid`）不需要

产物里 `setting.urlCheck` 已置为 `false`：设备要用 ws 回连
`127.0.0.1:17900`，开着合法域名校验会被拦。

要连真机，把 `angular.json` 里的 `clientHost` 改成开发机的局域网 IP
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
