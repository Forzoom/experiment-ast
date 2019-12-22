const recast = require('recast');
const fs = require('fs');
const path = require('path');
// 尝试自定义扩展ast-types的定义
const { Type, builtInTypes, builders: b, finalize } = require('ast-types');
const { def } = Type;
const { string } = builtInTypes;
const tsParser = require('@typescript-eslint/typescript-estree');
const {
    importModuleFromVuex,
    importRootStateFromStoreDTS,
    exportDefaultM,
    extractPropertyFromObject,
    camcelCaseWithFirstLetter,
    asOriginal,
    getValueWithAddId,
} = require('./utils');

/**
 * 对于vue文件进行处理
 */
module.exports = function(input, output) {
    const extname = path.extname(input);
    if (extname !== '.vue') {
        console.warn(input + ' isnt a vue file');
        return;
    }
    const originalCode = fs.readFileSync(input, 'utf-8');
    const startPos = originalCode.indexOf('<script>');
    const endPos = originalCode.indexOf('</script>');
    const header = originalCode.substr(0, startPos) + '<script lang="ts">';
    const footer = originalCode.substr(endPos);
    const jsScript = originalCode.substr(startPos + 8, endPos - startPos - 8);
    const originalAst = recast.parse(jsScript, {
        parser: tsParser,
    });
    const generatedAst = recast.parse('');

    const {
        list: methods,
        factory: extractMethods,
    } = extractPropertyFromObject('methods', getValueWithAddId);

    recast.visit(originalAst, {
        visitProperty(p) {
            extractMethods(p);
            this.traverse(p);
        },
    });

    console.log(methods.map(v => v));
    generatedAst.program.body.push(...methods);
    const code = recast.print(generatedAst).code;
    console.log(code);
}