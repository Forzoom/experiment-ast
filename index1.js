const path = require('path');
const recast = require('recast'); // Abstract Syntax Tree
const sourceMap = require('source-map');
const SourceMapConsumer = sourceMap.SourceMapConsumer;
const fs = require('fs');
const generatedCode = fs.readFileSync('./assets/app.2a38f758.js', 'utf-8');
const sourceMapContent = JSON.parse(fs.readFileSync('./assets/app.2a38f758.js.map', 'utf-8'));
const ast = recast.parse(generatedCode);

(async () => {
    // 如何使用sourceMap文件和generated文件来还原sourceMap文件呢
    consumer = await new SourceMapConsumer(sourceMapContent);
    // 可以重新visit，并且对所有的进行处理，但是因为不知道uglify做map的时候是如何处理的，所以使用visit来恢复很困难
    const generatedMap = {};

    // 或者对于sourceMap进行parse之后，遍历sourceMap进行处理
    list = generatedCode.split('\n');
    consumer.eachMapping((m) => {
        const key = m.generatedLine + '_' + m.generatedColumn;
        generatedMap[key] = m;

        // const line = list[m.generatedLine - 1];
        // list[m.generatedLine - 1] = line.substr(0, m.generatedColumn) + m.name + line.substr(m.generatedColumn + m.name.length);
    });
    // console.log(list);
    consumer.destroy();

    recast.visit(ast, {
        visitBlockStatement(stmt) {
            const body = stmt.value.body;
            if (body) {
                body.forEach(item => {
                    const start = item.loc.start;
                    const key = start.line + '_' + start.column;
                    if (generatedMap[key]) {
                        const m = generatedMap[key];
                        delete generatedMap[key];
                        item.name = m.name;
                    }
                })
            }
            this.traverse(stmt);
        },
        visitIdentifier(identifier) {
            const id = identifier.value;
            const start = id.loc.start;
            const key = start.line + '_' + start.column;
            if (generatedMap[key]) {
                const m = generatedMap[key];
                delete generatedMap[key];
                // 只是对于name进行修改
                id.name = m.name;
                // 如果对于loc进行修改的话，是否能够生成正确行信息，或者说recast.print最终是如何生成代码的呢?
                // id.loc.start = {
                //     line: m.originalLine,
                //     column: m.originalColumn,
                //     token: id.loc.start.token,
                // };
                // id.loc.end = {
                //     line: m.generatedLine,
                //     column: m.generatedColumn,
                //     token: id.loc.end.token,
                // };
                // 不是很明白这里的token的意义
                // console.log(id, m);
                this.traverse(identifier);
            } else {
                this.traverse(identifier);
            }
        },
    });

    console.log(ast.program.loc.tokens);
    const keys = Object.keys(generatedMap);
    console.log(keys.length);
    console.log(keys.slice(0, 30).map(key => generatedMap[key]));
    code = recast.print(ast).code;

    fs.writeFileSync(path.join(__dirname, './assets/app.js'), code);
});

(async () => {
    let output = false;
    consumer = await new SourceMapConsumer(sourceMapContent);
    consumer.eachMapping((item) => {
        if (output) {
            return;
        }
        output = true;
        console.log(item);
    })
    // 使用consumer就已经足够将内容还原出来，为什么呢?
    // const result = consumer.sourceContentFor('webpack:///src/store/index.ts');
    const result = consumer.originalPositionFor({
        line: 1,
        column: 13,
    });
    console.log(result);
})();
