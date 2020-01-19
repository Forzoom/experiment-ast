import recast from 'recast';
import fs from 'fs';
import path from 'path';
// 尝试自定义扩展ast-types的定义
import { Type, builtInTypes, builders as b, finalize, namedTypes } from 'ast-types';
import parser from '@babel/parser';
import {
    extractPropertyFromObject,
    asOriginal,
    asPropertiesInObject,
    getValueWithAddId,
    extractExportDefault,
    parseMemberExpression,
    formatMemberExpression,
    importFromVuePropertyDecorator,
    camelCaseWithDollar,
    any,
} from './utils';
const { def } = Type;
const { string } = builtInTypes;

function handleProp(props: namedTypes.Property) {
    const objectExpression = props.value as namedTypes.ObjectExpression;
    return objectExpression.properties.map((property: namedTypes.ObjectProperty) => {
        const definition = b.classProperty(property.key, null);
        definition.access = 'public';
        definition.decorators = [
            b.decorator(b.callExpression(b.identifier('Prop'), [
                property.value as namedTypes.ObjectExpression,
            ]))
        ];
        return definition;
    });
}

function handleData(data: namedTypes.Property) {
    const functionExpression = data.value as namedTypes.FunctionExpression;
    const returnStatement = functionExpression.body.body[0] as namedTypes.ReturnStatement;
    const objectExpression = returnStatement.argument as namedTypes.ObjectExpression;
    const properties = objectExpression.properties;
    return properties.map((property: namedTypes.ObjectProperty) => {
        const definition = b.classProperty(property.key, property.value as namedTypes.PrimitiveLiteral, any());
        definition.access = 'public';
        return definition;
    });
}

function handleComputed(computed: namedTypes.Property) {
    const objectExpression = computed.value as namedTypes.ObjectExpression;
    return objectExpression.properties.map((property: namedTypes.Property | namedTypes.SpreadElement) => {
        if (property.type === 'SpreadElement') {
            const result = [];
            if (property.argument.type === 'CallExpression') {
                let namespace = [];
                for (const argument of property.argument.arguments) {
                    if (argument.type === 'Literal') {
                        namespace = (argument.value as string).split('/');
                    } else if (argument.type === 'ObjectExpression') {
                        // 这是所有的内容
                        for (const property of argument.properties as namedTypes.ObjectMethod[]) {
                            const declaration = b.tsDeclareMethod(property.key, []);
                            declaration.kind = 'get';
                            declaration.async = property.async;
                            const list = parseMemberExpression(property.value.body);
                            const memberExpression = formatMemberExpression([ 'store', 'state' ].concat(namespace).concat(list.slice(1)));
                            const returnStatement = b.returnStatement(memberExpression);
                            declaration.value = b.functionExpression(property.key as namedTypes.Identifier, [], b.blockStatement([returnStatement]));
                            declaration.accessibility = 'public';
                            result.push(declaration);
                        }
                    }
                }
            }
            return result;
        } else if (property.type === 'Property') {
            const functionExpression = property.value as namedTypes.FunctionExpression;
            const declaration = b.tsDeclareMethod(property.key, functionExpression.params);
            declaration.kind = 'get';
            declaration.async = functionExpression.async;
            declaration.value = functionExpression;
            declaration.accessibility = 'public';
            return declaration;
        }
    }).filter(_ => _);
}

function handleMethod(methods: namedTypes.ObjectMethod[]) {
    return methods.map(method => {
        const functionExpression = b.functionExpression(method.id, method.params, method.body);
        functionExpression.async = method.async;
        const declaration = b.methodDefinition('method', method.id, functionExpression);
        declaration.value = method;
        declaration.accessibility = 'public';
        return declaration;
    })
}

/**
 * 对于vue文件进行处理
 */
export default function(input: string, output: string) {
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

    // 如果存在props，处理props
    let propDefinitions = [];
    if (props.value) {
        propDefinitions = handleProp(props.value as namedTypes.Property);
    }

    // 处理data
    let dataDefinitions = [];
    if (dataFunc.value) {
        dataDefinitions = handleData(dataFunc.value as namedTypes.Property);
    }

    // 处理computed
    let computedDefinitions = [];
    if (computed.value) {
        computedDefinitions = handleComputed(computed.value as namedTypes.Property);
    }

    // 处理method
    const methodDefinitions = handleMethod(methods);

    // 处理watch
    let watchDefinitions = []
    if (watchList.value) {
        watchDefinitions = watchList.value.map((property: namedTypes.Property) => {
            const propertyKey = property.key;
            let propertyName = '';
            if (propertyKey.type === 'Identifier') {
                propertyName = propertyKey.name;
            } else if (propertyKey.type === 'Literal') {
                propertyName = propertyKey.value as string;
            }
            const method = property.value as namedTypes.FunctionExpression;
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
