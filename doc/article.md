## Vue从js迁移到ts

> 项目整理中，完成后补上Github链接

[Typescript](https://www.typescriptlang.org)正广泛成为前端工程师开发项目的首选，我手头上有一些使用js编写Vue项目，最近准备使用ts重写。项目中单单是页面的数量就超过100个，更不用提组件的数量，如果对这么多Vue文件进行一一重写的话，工程量浩大，并且十分枯燥。其实在此之前也手动转换过几个项目，发现重写过程都是相似的，通过代码是有可能自动地完成重写。当然从js转换到ts下，不可避免地会出现类型问题，现在的自动重写程序只要求完成重复性地工作，当真的需要类型信息时，还是需要手动处理。

使用ts来编写项目时，可以使用两种不同的代码风格：

1. 使用Vue.extend方法实现。
2. 使用class语法配合[vue-property-decorator](https://www.npmjs.com/package/vue-property-decorator)实现。

具体应该选择哪种方案，见仁见智。我所采用的是方法2。为什么选择它，如果使用方法1的话重写起来岂不是很方便？选择方法2是因为在Vue中大量使用`this`关键字，使用class形式更加符合直觉。

### 实现思路

实现思路就和把大象装进冰箱一样简单:

1. 将旧代码转换成AST（Abstract Syntax Tree, 抽象语法树）。
2. 将AST修改成class形式。（类型信息自然没法全部填上，可以先用any或者选择不填写）
3. 将AST转换成新代码。

recast库能够方便地解析js代码，同时也能够生成ts代码。关于recast库的使用还是参考原本的文档，这里就不再详细描述了。

### 代码和AST的转换

[recast](https://www.npmjs.com/package/recast)是一个可以方便对代码和AST进行转换的库，可以帮我们打开冰箱门和关上冰箱门。

#### 关于recast

recast中所使用的ast-types作为其类型内容，ast-types和estree所定义的类型好像稍有不同，ast-types所定义的内容没有estree那么全，例如在某些情况下，会存在decorators字段不存在的情况，自然可以通过d.ts文件对ast-types中的类型定义进行扩展。

如果对于编译原理了解的不是那么清楚的话，那么也可以通过recast.parse一些代码，来了解应该如何写，之后依葫芦画瓢编写代码就可以。

### 关于estree

在之后的内容中会遇到estree这个专有名词，这是将js代码解析成ast的一个社区标准，对这个标准有一定的了解，或者说你对于编译原理有一定的了解，有助于使用这些用于操作代码的库。estree有一个在github上的[仓库](https://github.com/estree/estree)。

### 选择parser

recast默认使用[esprima](https://www.npmjs.com/package/esprima)来进行语法解析，esprima对新语法已经有了较多的支持（目前使用4.0.1版本），但是对于目前在项目中使用的语法来说，还是有一些语法是esprima无法解析的，这里还找到另外两个用于语法解析的库，分别是[@typescript-eslint/typescript-estree](https://www.npmjs.com/package/@typescript-eslint/typescript-estree)和[@babel/parser](https://www.npmjs.com/package/@babel/parser)，其中@typescript-eslint/typescript-estree对于目前vue-property-decorator中使用的修饰器语法并不支持，所以推荐使用@babel/parser来完成对于代码的解析。

```typescript
const originalAst = recast.parse(jsScript, {
    parser: {
        parse(source: string, options: any) {
            return parser.parse(source, Object.assign(options, {
                plugins: [
                    'estree', // 支持estree格式
                    'decorators-legacy', // 支持修饰器语法
                ],
                tokens: true, // 必要的参数。默认为false，解析结果中缺少tokens内容，当缺少tokens时，recast将会重新使用esprima进行解析操作
            }))
        },
    },
    tabWidth: 4,
});
```

### 递归遍历

在Node中使用fs来完成对于文件的遍历

```javascript
import fs from 'fs';
const dir = '/Volumes/Repo2/repo/vue/tourye_web_ts/src';
const dist = '/Volumes/Repo2/repo/vue/tourye_web_ts_ast/src';
const pageDir = dir + '/pages';
const queue = [ pageDir ];

// 深度优先搜索
while (queue.length > 0) {
    const filePath = queue.shift();
    if (filePath) {
        const stats = fs.statSync(filePath);
        const isDirectory = stats.isDirectory();
        if (isDirectory) {
            // 如果是文件夹，加入queue
            const children = fs.readdirSync(filePath);
            queue.unshift(...children.map(child => filePath + '/' + child));
        } else {
            // 如果是文件，判断是否存在.vue
            if (filePath.indexOf('.vue') >= 0) {
                const output = dist + filePath.substr(dir.length);
                fs.mkdirSync(path.dirname(output), {
                    recursive: true,
                    mode: 0o755,
                });
                handleVue(filePath, output);
            }
        }
    }
}
```

### 之后要做什么

在完成这些之后考虑能否对于js版本代码进行解析，在未来用于生成Vue@3的API所使用的代码。