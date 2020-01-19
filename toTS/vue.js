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
    unshiftProperty,
    parseMemberExpression,
    formatMemberExpression,
    importFromVuePropertyDecorator,
    camelCaseWithDollar,
} = require('./utils');

/**
 * 对于vue文件进行处理
 */
module.exports = function(input, output) {
    console.log(input, output);
    const extname = path.extname(input);
    if (extname !== '.vue') {
        console.warn(input + ' isnt a vue file');
        return;
    }
    const originalCode = fs.readFileSync(input, 'utf-8');
    const startPos = originalCode.indexOf('<script>');
    if (startPos < 0) {
        console.warn(input + ' script is lost');
        return;
    }
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
        result: props,
        factory: extractProps,
    } = extractExportDefault('props', asOriginal);
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
            extractProps(p);
            extractData(p);
            extractComputed(p);
            extraWatch(p);
            extractMethods(p);
            this.traverse(p);
        },
    });

    if (!name.value) {
        console.warn(input + ' lost name');
        return;
    }

    /** 类名，大写开头 */
    const className = name.value.value.value;

    // 处理props
    let propDefinitions = [];
    // 如果存在props
    if (props.value) {
        const objectExpression = props.value.value;
        propDefinitions = objectExpression.properties.map(property => {
            const definition = b.classProperty(property.key, null);
            definition.accessibility = 'public';
            definition.decorators = [
                b.decorator(b.callExpression(b.identifier('Prop'), [
                    property.value,
                ]))
            ];
            return definition;
        });
    }

    // 处理data
    let dataDefinitions = [];
    if (dataFunc.value) {
        const returnStatement = dataFunc.value.value.body.body[0];
        const objectExpression = returnStatement.argument;
        const properties = objectExpression.properties;
        dataDefinitions = properties.map(property => {
            const definition = b.classProperty(property.key, property.value);
            definition.accessibility = 'public';
            definition.value = property.value;
            return definition;
        });
    }

    // 处理computed
    let computedDefinitions = [];
    if (computed.value) {
        computedDefinitions = computed.value.value.properties.map((property) => {
            if (property.type === 'SpreadElement') {
                const result = [];
                if (property.argument.type === 'CallExpression') {
                    let namespace = [];
                    for (const argument of property.argument.arguments) {
                        if (argument.type === 'Literal') {
                            namespace = argument.value.split('/');
                        } else if (argument.type === 'ObjectExpression') {
                            // 这是所有的内容
                            for (const property of argument.properties) {
                                const declaration = b.tsDeclareMethod(property.key, []);
                                declaration.kind = 'get';
                                declaration.async = property.async;
                                const list = parseMemberExpression(property.value.body);
                                const memberExpression = formatMemberExpression([ 'store', 'state' ].concat(namespace).concat(list.slice(1)));
                                const returnStatement = b.returnStatement(memberExpression);
                                declaration.value = b.functionExpression(property.key, [], b.blockStatement([returnStatement]));
                                declaration.accessibility = 'public';
                                result.push(declaration);
                            }
                        }
                    }
                }
                return result;
            } else if (property.type === 'Property') {
                const functionExpression = property.value;
                const declaration = b.tsDeclareMethod(property.key, functionExpression.params);
                declaration.kind = 'get';
                declaration.async = functionExpression.async;
                declaration.value = functionExpression;
                declaration.accessibility = 'public';
                return declaration;
            }
        }).filter(_ => _);
    }

    const methodDefinitions= methods.map(method => {
        const declaration = b.tsDeclareMethod(method.id, method.params);
        declaration.kind = 'method';
        declaration.async = method.async;
        declaration.value = method;
        declaration.accessibility = 'public';
        return declaration;
    });

    // 处理watch
    let watchDefinitions = []
    if (watchList.value) {
        watchDefinitions = watchList.value.map(property => {
            const propertyKey = property.key;
            const propertyName = propertyKey.type === 'Identifier' ? propertyKey.name : propertyKey.value;
            const method = property.value;
            // todo: 需要修改函数的名字
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
    }

    // 定义class
    const clazz = b.classDeclaration(
        b.identifier(className),
        b.classBody([
            ...propDefinitions,
            ...dataDefinitions,
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
                        componentList.value
                    ].filter(_ => _)),
                ],
            )
        )
    ];
    const exportDefault = b.exportDefaultDeclaration(clazz);

    // 处理vue-property-decorator
    const importFromVPD = importFromVuePropertyDecorator([
        props.value && props.value.value.properties.length > 0 ? 'Prop' : null,
        watchList.value && watchList.value.length > 0 ? 'Watch' : null,
    ]);

    generatedAst.program.body.push(...importDeclarations, importFromVPD);
    generatedAst.program.body.push(exportDefault);
    const code = header + '\n' + recast.print(generatedAst).code + '\n' + footer;
    
    fs.writeFileSync(output, code);
}
