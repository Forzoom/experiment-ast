const recast = require('recast');
const SourceMapGenerator = require('source-map').SourceMapGenerator;
const SourceMapConsumer = require('source-map').SourceMapConsumer;

const ast = recast.parse(code);
const generator = new SourceMapGenerator({
    file: 'mapped.js',
});
// console.log(recast.print(ast).code);

recast.visit(ast, {
    // 函数声明
    visitFunctionDeclaration(functionDeclaration) {
        console.log('function');
        // console.log(functionDeclaration.value);

        // 尝试对于函数名字进行修改
        const id = functionDeclaration.value.id;
        id.name = 'bar';
        generator.addMapping({
            generated: id.loc.start, // 生成的文件并非是source map，而是bar文件
            source: 'foo.js',
            original: id.loc.start, // 存在start和end的情况下，该如何处理
            name: 'foo',
        });

        return false;
    },
    // 表达式中只有 函数调用 被检测到了
    visitExpressionStatement(nodePath) {
        console.log('expression');
        console.log(nodePath.value);

        nodePath.value.expression.callee.name = 'bar';
        generator.addMapping({
            generated: nodePath.value.loc.start,
            source: 'foo.js',
            original: nodePath.value.loc.start,
            name: 'foo',
        });

        return false;
    },
});

const sourceMap = generator.toString();
const generatedCode = recast.print(ast).code;
console.log(sourceMap);
console.log(generatedCode);

(async () => {
    // 如何使用sourceMap文件和generated文件来还原sourceMap文件呢
    consumer = await new SourceMapConsumer(JSON.parse(sourceMap));
    // 可以重新visit，并且对所有的进行处理，但是因为不知道uglify做map的时候是如何处理的，所以使用visit来恢复很困难

    // 或者对于sourceMap进行parse之后，遍历sourceMap进行处理
    list = generatedCode.split('\n');
    consumer.eachMapping((m) => {
        console.log(m);
        const line = list[m.generatedLine - 1];
        list[m.generatedLine - 1] = line.substr(0, m.generatedColumn) + m.name + line.substr(m.generatedColumn + m.name.length);
    });
    console.log(list);
    consumer.destroy();
})();
