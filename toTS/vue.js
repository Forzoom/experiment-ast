const recast = require('recast');
const fs = require('fs');
const path = require('path');
// 尝试自定义扩展ast-types的定义
const { Type, builtInTypes, builders: b, finalize } = require('ast-types');
const { def } = Type;
const { string } = builtInTypes;
const parser = require('@babel/parser');
const {
    extractPropertyFromObject,
    asOriginal,
    asPropertiesInObject,
    getValueWithAddId,
    extractExportDefault,
    addStore,
    importFromVuePropertyDecorator,
    camelCaseWithDollar,
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
        parser: {
            parse(source, options) {
                return parser.parse(source, Object.assign(options, {
                    plugins: [
                        'estree',
                        'decorators-legacy',
                    ],
                    tokens: true,
                }))
            },
        },
        tabWidth: 4,
    });
    const generatedAst = recast.parse('', {
        tabWidth: 4,
    });

    const importDeclarations = [];
    const {
        result: name,
        factory: extractName,
    } = extractExportDefault('name', asOriginal);
    const {
        result: componentList,
        factory: extraComponent,
    } = extractExportDefault('components', asOriginal);
    const {
        result: dataFunc,
        factory: extractData,
    } = extractExportDefault('data', asOriginal);
    const {
        result: computed,
        factory: extractComputed,
    } = extractExportDefault('computed', asOriginal);
    const {
        result: watchList,
        factory: extraWatch,
    } = extractExportDefault('watch', asPropertiesInObject);
    const {
        list: methods,
        factory: extractMethods,
    } = extractPropertyFromObject('methods', getValueWithAddId);

    recast.visit(originalAst, {
        // 处理import
        visitImportDeclaration(d) {
            importDeclarations.push(d.value);
            this.traverse(d);
        },
        visitProperty(p) {
            extractName(p);
            extraComponent(p);
            extractData(p);
            extractComputed(p);
            extraWatch(p);
            extractMethods(p);
            this.traverse(p);
        },
    });

    /** 类名，大写开头 */
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
    // 为所有的function添加property
    const watchDefinitions = watchList.value.map(property => {
        const propertyKey = property.key;
        const propertyName = propertyKey.type === 'Identifier' ? propertyKey.name : propertyKey.value;
        const method = property.value;
        // todo: 需要修改函数的名字
        console.log(property.key);
        const declaration = b.tsDeclareMethod(b.identifier('on' + camelCaseWithDollar(propertyName) + 'Change'), method.params);
        declaration.kind = 'method'; // 是一个正常函数
        declaration.async = method.async; // 是否async
        declaration.value = method; // 函数体内容
        declaration.accessibility = 'public';
        declaration.decorators = [
            b.decorator(b.callExpression(b.identifier('Watch'), [
                b.literal(propertyName),
            ])),
        ];
        return declaration;
    });

    // 定义class
    const clazz = b.classDeclaration(
        b.identifier(className),
        b.classBody([
            ...computedDefinitions.flat(),
            ...watchDefinitions,
            ...methodDefinitions,
        ]),
        b.identifier('Vue')
    );
    clazz.decorators = [
        b.decorator(
            b.callExpression(
                b.identifier('Component'),
                [
                    b.objectExpression([
                        b.property('init', b.identifier('name'), b.literal(className)),
                        componentList.value,
                    ]),
                ],
            )
        )
    ];
    const exportDefault = b.exportDefaultDeclaration(clazz);

    // 处理vue-property-decorator
    const importFromVPD = importFromVuePropertyDecorator([
        watchList.value.length > 0 ? 'Watch' : null,
    ]);

    generatedAst.program.body.push(...importDeclarations, importFromVPD);
    generatedAst.program.body.push(exportDefault);
    const code = header + '\n' + recast.print(generatedAst).code + '\n' + footer;
    
    fs.writeFileSync(output, code);
}
