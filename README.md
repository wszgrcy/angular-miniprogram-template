# AngularMiniprogramTemplate
这个项目为Angular开发小程序的初始化模板

## 开发

- `yarn start`

## 构建

- `yarn build` 开发环境
- `yarn build:prod` 生产环境

## 组件开发
- `yarn build:lib`

### 注意
- 由于组件库是从ng13开始支持,所以不需要,也不兼容之前的(之前的也没有.....= =#),所以构建模式为`"compilationMode": "full"`
- 目前还未处于正式发布阶段,所以原则上不做任何兼容保证,也就是不同版本的组件库和应用可能不会支持互相调用(这个状态将一直维持到正式发布)
- 组件库构建制品可以在web上使用,但是web上的一定不能再小程序中使用