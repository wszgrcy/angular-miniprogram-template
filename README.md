# AngularMiniprogramTemplate

Angular 开发小程序（微信 / 支付宝 / 百度 / QQ …）的初始化模板。

当前基线：**Angular 22.1.x + angular-miniprogram 2.x + TypeScript 6.0 + ng-packagr 22**。

## 环境

- Node `^22.22.3 || ^24.15.0`（Angular 22 的 engines 要求）
- 微信开发者工具（跑 `ng test` 时需要）

## 命令

| 命令                 | 说明                                    |
| -------------------- | --------------------------------------- |
| `npm run build:lib`  | 构建示例库 `first`（应用依赖它的产物）  |
| `npm run build`      | 构建小程序（development）               |
| `npm run build:prod` | 构建小程序（production）                |
| `npm start`          | `ng build --watch`                      |
| `npm run test:lib`   | 跑 `first` 库的小程序 karma 用例        |

产物在 `dist/angular-miniprogram-template`，用微信开发者工具打开该目录即可。

> `build` 之前必须先 `build:lib`：`tsconfig.json` 的 `paths` 把 `first`
> 指到 `dist/first`，库没构建的话应用编译会找不到模块。

## 关于 `angular-miniprogram` 的接入方式

`package.json` 里现在是 **本地 link**：

```json
"angular-miniprogram": "file:../angular-miniprogram/dist"
```

装完 `node_modules/angular-miniprogram` 是指向本地库产物目录的软链，
方便边改库边验证。要发布 / 给别人用时换成 npm 版本：

```json
"angular-miniprogram": "^2.0.0"
```

link 方式有个坑已经在 builder 里处理掉了：Vite 默认把符号链接解析成真实路径，
库内部的 `@angular/core` 会从库自己的 `node_modules` 解析，和应用那份
不是同一个模块，同一份 Angular 被打成两份，运行时直接废。
builder 现在给 `resolve.dedupe` 填了单例包名单，详见库里的
`src/builder/vite/dedupe.ts`。

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
开发者工具，得你把它打开。两种方式：

### 方式一：GUI 手动打开

微信开发者工具 → 导入项目 → 选 `dist/karma/first`。

### 方式二：CLI 自动打开（推荐，可进 CI）

先在开发者工具 **设置 → 安全设置** 里打开「服务端口」，然后：

```bash
# 终端 A：起 karma server（会一直等着）
npm run test:lib

# 终端 B：拉起项目并开自动化
"<安装路径>/cli.bat" auto \
  --project "<绝对路径>/dist/karma/first" --auto-port 9420
```

跑完 karma 侧会出 `小程序: Executed 2 of 2 SUCCESS`。

> **CLI 必须用真实 AppID。** 模板里 `src/project.config.json` 的
> `appid` 是 `touristappid`，游客模式只能 GUI 打开，CLI 会报
> `不存在此 AppID (code 10)`。要用 CLI / CI，把 `appid` 换成你自己
> 账号下有权限的小程序 AppID。
>
> 另外 `setting.urlCheck` 已置为 `false`：测试客户端要用 socket.io 回连
> `127.0.0.1:9876`，开着合法域名校验会被拦。

### 端口注意

`KARMA_PORT` 是**编译期**烧进产物的（默认 9876）。如果 9876 已被占用，
karma server 会自己漂到 9877，但产物里仍然连 9876 —— 表现是客户端
连不上、一直卡在 `Starting browser miniprogram`。跑之前先确保 9876 空着：

```bash
# 有残留就先清掉
netstat -ano | grep 9876
```

要连真机，把 builder 配置里的 `clientHost` 改成开发机的局域网 IP
（默认 `127.0.0.1`；微信模拟器解不了 `localhost`）。
