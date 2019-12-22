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
    extractExportDefault,
    addStore,
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
    const {
        result: computed,
        factory: extractComputed,
    } = extractExportDefault('computed', asOriginal);
    const {
        result: name,
        factory: extractName,
    } = extractExportDefault('name', asOriginal);

    recast.visit(originalAst, {
        visitProperty(p) {
            extractMethods(p);
            extractName(p);
            extractComputed(p);
            this.traverse(p);
        },
    });

    const className = name.value.value.value;
    const computedDefinitions = computed.value.value.properties.map((property) => {
        // console.log(property);
        if (property.type === 'SpreadElement') {
            const result = [];
            if (property.argument.type === 'CallExpression') {
                for (const argument of property.argument.arguments) {
                    // 这是所有的内容
                    for (const property of argument.properties) {
                        const declaration = b.tsDeclareMethod(property.key, []);
                        declaration.kind = 'get';
                        declaration.async = property.async;
                        const returnStatement = b.returnStatement(addStore(property.value.body));
                        declaration.value = b.functionExpression(property.key, [], b.blockStatement([returnStatement]));
                        declaration.accessibility = 'public';
                        result.push(declaration);
                    }
                }
            }
            return result;
        } else if (property.type === 'FunctionExpression') {
            const declaration = b.tsDeclareMethod(property.id, property.params);
            declaration.kind = 'get';
            declaration.async = property.async;
            declaration.value = property;
            declaration.accessibility = 'public';
            return declaration;
        }
    });
    const methodDefinitions = methods.map(method => {
        const declaration = b.tsDeclareMethod(method.id, method.params);
        declaration.kind = 'method';
        declaration.async = method.async;
        declaration.value = method;
        declaration.accessibility = 'public';
        return declaration;
    });
    // console.log('target12', computedDefinitions.flat().length);
    // 定义class
    const clazzDecorator = b.decorator(b.objectExpression([b.property('init', b.identifier('name'), b.literal(className))]));
    const clazz = b.classDeclaration(b.identifier(className), b.classBody([...computedDefinitions.flat(), ...methodDefinitions]), b.identifier('Vue'));

    generatedAst.program.body.push(clazzDecorator, clazz);
    const code = recast.print(generatedAst).code;
    console.log(code);
}