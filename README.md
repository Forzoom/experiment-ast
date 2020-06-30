### Start

```bash
yarn add shuttle
# 或者
npm install shuttle

# 全局安装
yarn global add shuttle
# 或者
npm install shuttle -g
```

### Usage

#### 命令行形式

shuttle库提供了命令行形式

```bash
shuttle --help # 查看提示信息
shuttle -s=/path/to/src/component.vue\ # 指定源文件路径
  -d=/path/to/dst/component.vue\ # 指定生成文件路径
  -p=jsVue\ # 指定解析器
  -g=tsClassVue\ # 指定生成其
  --generator-plugin=addImportStore\ # 指定生成器插件
  --generator-plugin=addParamsTypeAnnotation # 指定生成器插件
```

#### 解析器

支持: `jsVue`、`tsClassVue`

其中

`jsVue`格式为
```javascript
export default {
    name: 'Cmp',
}
```
`tsClassVue`格式为
```typescript
@Component({
    name: 'Cmp'
})
export default class Cmp extends Vue {}
```

#### 生成器

支持: `jsVue`、`tsClassVue`，其格式类型和解析器中相同

#### 代码引入

除了命令行模式外还支持代码引入

### Test

应该如何做test呢?

### Todo

1. 当template中有多个template的情况下，会发生错误
