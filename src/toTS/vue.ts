import * as recast from 'recast';
import fs from 'fs';
import path from 'path';
// 尝试自定义扩展ast-types的定义
import { builders as b, namedTypes } from 'ast-types';
import * as parser from '@babel/parser';
import {
    Extract,
    parseMemberExpression,
    formatMemberExpression,
    importFromVuePropertyDecorator,
    camelCaseWithDollar,
    any,
} from './utils';

function handleImport(imports: namedTypes.ImportDeclaration[]) {
    imports.forEach((importDeclaration) => {
        if (importDeclaration.source.type === 'Literal' && typeof importDeclaration.source.value == 'string') {
            importDeclaration.source.value = (importDeclaration.source.value as string).replace(/\.js$/, '');
        }
    });
}

function handleProp(props: namedTypes.Property) {
    const objectExpression = props.value as namedTypes.ObjectExpression;
    return (objectExpression.properties as namedTypes.ObjectProperty[]).map((property) => {
        const definition = b.classProperty(property.key, null, any());
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
    return (properties as namedTypes.ObjectProperty[]).map((property) => {
        const definition = b.classProperty(property.key, property.value as namedTypes.PrimitiveLiteral, any());
        definition.access = 'public';
        return definition;
    });
}

function handleComputed(computed: namedTypes.Property) {
    const result: namedTypes.MethodDefinition[] = [];
    const objectExpression = computed.value as namedTypes.ObjectExpression;
    (objectExpression.properties as Array<namedTypes.Property | namedTypes.SpreadElement>).forEach((property) => {
        if (property.type === 'SpreadElement') {
            const l: namedTypes.MethodDefinition[] = [];
            if (property.argument.type === 'CallExpression') {
                let namespace: string[] = [];
                for (const argument of property.argument.arguments) {
                    if (argument.type === 'Literal') {
                        namespace = (argument.value as string).split('/');
                    } else if (argument.type === 'ObjectExpression') {
                        // 这是所有的内容
                        for (const property of argument.properties as namedTypes.Property[]) {
                            let list: string[] = [];
                            let async: boolean | undefined = false;
                            if (property.value.type === 'FunctionExpression') {
                                const functionExpression = property.value;
                                list = parseMemberExpression((functionExpression.body.body[0] as namedTypes.ReturnStatement).argument as namedTypes.MemberExpression);
                                async = functionExpression.async;
                            } else if (property.value.type === 'ArrowFunctionExpression') {
                                const arrowFunctionExpression = property.value;
                                if (arrowFunctionExpression.body.type === 'MemberExpression') {
                                    list = parseMemberExpression(arrowFunctionExpression.body);
                                    async = arrowFunctionExpression.async;
                                }
                            }
                            const memberExpression = formatMemberExpression([ 'store', 'state' ].concat(namespace).concat(list.slice(1)));
                            const returnStatement = b.returnStatement(memberExpression);
                            const newFunctionExpression = b.functionExpression(property.key as namedTypes.Identifier, [], b.blockStatement([returnStatement]));
                            newFunctionExpression.async = async;
                            const declaration = b.methodDefinition('get', property.key, newFunctionExpression);
                            declaration.kind = 'get';
                            declaration.accessibility = 'public';
                            l.push(declaration);
                        }
                    }
                }
            }
            result.push(...l);
        } else if (property.type === 'Property') {
            const functionExpression = property.value as namedTypes.FunctionExpression;
            const declaration = b.methodDefinition('get', property.key, functionExpression);
            declaration.accessibility = 'public';
            result.push(declaration);
        }
    });
    return result;
}

function handleMethod(methods: namedTypes.Property[]) {
    return methods.map(method => {
        if (method.value.type === 'FunctionExpression') {
            const functionExpression = b.functionExpression(method.key as namedTypes.Identifier, method.value.params, method.value.body);
            functionExpression.async = method.value.async;
            const declaration = b.methodDefinition('method', method.key as namedTypes.Identifier, functionExpression);
            declaration.accessibility = 'public';
            return declaration;
        }
    })
}

function handleWatch(list: namedTypes.Property[]) {
    return list.map((property: namedTypes.Property) => {
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
        // @ts-ignore
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
            parse(source: string, options: any) {
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

    const importDeclarations: namedTypes.ImportDeclaration[] = [];
    let extract = new Extract(originalAst);
    const name = extract.extractFromExportDefault('name');
    const componentList = extract.extractFromExportDefault('components');
    const props = extract.extractFromExportDefault('props');
    const dataFunc = extract.extractFromExportDefault('data');
    const computed = extract.extractFromExportDefault('computed');
    const watchList = extract.extractFromExportDefault('watch');
    const methods = extract.extractFromExportDefault('methods');
    const lifecycleDefinitions: namedTypes.MethodDefinition[] = [];

    recast.visit(originalAst, {
        // 处理import
        visitImportDeclaration(d) {
            importDeclarations.push(d.value);
            this.traverse(d);
        },
        // 处理所有的函数参数
        visitFunctionDeclaration(p) {
            const functionDeclaration = p.value as namedTypes.FunctionDeclaration;
            const params = functionDeclaration.params;
            if (params) {
                functionDeclaration.params = params.map((param) => {
                    if (param.type === 'Identifier') {
                        if (!param.typeAnnotation) {
                            param.typeAnnotation = any();
                        }
                    } else if (param.type === 'ObjectPattern') {
                        if (!param.typeAnnotation) {
                            param.typeAnnotation = any();
                        }
                    }
                    
                    return param;
                });
            }
            this.traverse(p);
        },
        visitFunctionExpression(p) {
            const functionDeclaration = p.value as namedTypes.FunctionExpression;
            const params = functionDeclaration.params;
            if (params) {
                functionDeclaration.params = params.map((param) => {
                    if (param.type === 'Identifier') {
                        if (!param.typeAnnotation) {
                            param.typeAnnotation = any();
                        }
                    } else if (param.type === 'ObjectPattern') {
                        if (!param.typeAnnotation) {
                            param.typeAnnotation = any();
                        }
                    }
                    
                    return param;
                });
            }
            this.traverse(p);
        },
        visitArrowFunctionExpression(p) {
            const arrowFunctionExpression = p.value as namedTypes.ArrowFunctionExpression;
            const params = arrowFunctionExpression.params;
            if (params) {
                arrowFunctionExpression.params = params.map((param) => {
                    if (param.type === 'Identifier') {
                        if (!param.typeAnnotation) {
                            param.typeAnnotation = any();
                        }
                    } else if (param.type === 'ObjectPattern') {
                        if (!param.typeAnnotation) {
                            param.typeAnnotation = any();
                        }
                    }

                    return param;
                });
            }
            this.traverse(p);
        },
        visitProperty(p) {
            const property = p.value as namedTypes.Property;
            if (property.key && property.key.type === 'Identifier') {
                const name = property.key.name;
                if ([ 'created', 'mounted', 'beforeDestroy', 'beforeRouteEnter', 'beforeRouteUpdate', 'beforeRouteLeave' ].indexOf(name) >= 0) {
                    const declaration = b.methodDefinition('method', property.key as namedTypes.Identifier, property.value as namedTypes.FunctionExpression);
                    declaration.accessibility = 'public';
                    lifecycleDefinitions.push(declaration);
                }
            }
            this.traverse(p);
        },
    });

    const body = originalAst.program.body as namedTypes.Node[];
    const other: namedTypes.Node[] = [];
    body.forEach((item) => {
        if (item.type === 'ImportDeclaration') {
            // nothing
        } else if (item.type === 'ExportDefaultDeclaration') {
            // nothing
        } else {
            other.push(item);
        }
    });

    handleImport(importDeclarations);
    console.info('handle import done!');

    if (!name) {
        console.warn(input + ' lost name');
        return;
    }
    /** 类名，大写开头 */
    const className = (name.value as namedTypes.StringLiteral).value;

    // 如果存在props，处理props
    let propDefinitions: namedTypes.ClassProperty[] = [];
    if (props) {
        propDefinitions = handleProp(props);
    }
    console.info('handle props done!');

    // 处理data
    let dataDefinitions: namedTypes.ClassProperty[] = [];
    if (dataFunc) {
        dataDefinitions = handleData(dataFunc);
    }
    console.info('handle data done!');

    // 处理computed
    let computedDefinitions: namedTypes.MethodDefinition[] = [];
    if (computed) {
        computedDefinitions = handleComputed(computed);
    }
    console.info('handle computed done!');

    // 处理method
    let methodDefinitions: namedTypes.MethodDefinition[] = [];
    if (methods) {
        methodDefinitions = handleMethod((methods.value as namedTypes.ObjectExpression).properties as namedTypes.Property[]).filter(_ => _) as namedTypes.MethodDefinition[];
    }
    console.info('handle methods done!');

    // 处理watch
    let watchDefinitions: namedTypes.TSDeclareMethod[] = []
    if (watchList) {
        watchDefinitions = handleWatch((watchList.value as namedTypes.ObjectExpression).properties as namedTypes.Property[]);
    }
    console.info('handle watch done!');

    // 定义class
    const clazz = b.classDeclaration(
        b.identifier(className),
        b.classBody([
            ...propDefinitions,
            ...dataDefinitions,
            ...computedDefinitions.flat(),
            ...watchDefinitions,
            ...methodDefinitions,
            ...lifecycleDefinitions,
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
                        componentList!,
                    ].filter(_ => _)),
                ],
            )
        )
    ];
    const exportDefault = b.exportDefaultDeclaration(clazz);

    // 处理vue-property-decorator
    const importFromVPD = importFromVuePropertyDecorator([
        props && (props.value as namedTypes.ObjectExpression).properties.length > 0 ? 'Prop' : null,
        watchDefinitions.length > 0 ? 'Watch' : null,
    ]);

    generatedAst.program.body.push(...importDeclarations, importFromVPD, ...other);
    generatedAst.program.body.push(exportDefault);
    const code = header + '\n' + recast.print(generatedAst).code + '\n' + footer;
    
    fs.writeFileSync(output, code);
}
