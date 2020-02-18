import * as recast from 'recast';
import * as parser from '@babel/parser';
import { namedTypes, builders as b } from 'ast-types';
import path from 'path';
import fs from 'fs';

function getComponentFilePath(variableDeclarator: namedTypes.VariableDeclarator) {
    const varInit = variableDeclarator.init as namedTypes.ArrowFunctionExpression;
    const ensureCall = ((varInit.body as namedTypes.BlockStatement).body[0] as namedTypes.ExpressionStatement).expression as namedTypes.CallExpression;
    const resolveCall = (((ensureCall.arguments[1] as namedTypes.ArrowFunctionExpression).body as namedTypes.BlockStatement).body[0] as namedTypes.ExpressionStatement).expression as namedTypes.CallExpression;
    return ((resolveCall.arguments[0] as namedTypes.CallExpression).arguments[0] as namedTypes.StringLiteral).value;
}

function createRouteImportArrowFn(filepath: string, webpackChunkName?: string) {
    const filepathLiteral = b.stringLiteral(filepath);
    if (webpackChunkName) {
        filepathLiteral.comments = [
            b.commentBlock(` webpackChunkName: "${webpackChunkName}" `, true),
        ];
    }
    return b.arrowFunctionExpression(
        [],
        b.callExpression(b.import(), [ filepathLiteral ]),
    );
}

export default function(input: string, output: string) {
    console.info(input, output);
    const extname = path.extname(input);
    if (extname !== '.js') {
        console.warn(input + ' isnt a js file');
        return;
    }
    if (/index.js/.test(input)) {
        console.warn(input + ' is index file');
        return;
    }
    const fileName = path.basename(input, extname);
    const originalCode = fs.readFileSync(input, 'utf-8');
    const originalAst = recast.parse(originalCode, {
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
    });
    const generatedAst = recast.parse('');

    // 解析得到 import + 组件定义 + 默认导出对象
    const importDeclarations: namedTypes.ImportDeclaration[] = [];
    const variableDeclarations: namedTypes.VariableDeclaration[] = [];
    let exportDefaultDeclaration: namedTypes.ExportDefaultDeclaration | null = null;
    
    for (const node of originalAst.program.body as namedTypes.Node[]) {
        if (node.type === 'ImportDeclaration') {
            importDeclarations.push(node as namedTypes.ImportDeclaration);
        } else if (node.type === 'VariableDeclaration') {
            variableDeclarations.push(node as namedTypes.VariableDeclaration);
        } else if (node.type === 'ExportDefaultDeclaration') {
            exportDefaultDeclaration = node as namedTypes.ExportDefaultDeclaration;
        }
    }

    // 修改默认导出对象，需要和组件定义一一对应
    const componentVariableMap: {
        [compName: string]: string,
    } = {};
    for (const variableDeclaration of variableDeclarations) {
        const declarator = variableDeclaration.declarations[0] as namedTypes.VariableDeclarator;
        if (declarator.id.type === 'Identifier') {
            const filepath = getComponentFilePath(declarator);
            componentVariableMap[declarator.id.name] = filepath;
        }
    }
    console.log(componentVariableMap);

    // 修改component对象内容
    if (!exportDefaultDeclaration) {
        console.warn('Cannot find export default part');
        return;
    }
    const routes = (exportDefaultDeclaration.declaration as namedTypes.ArrayExpression).elements as namedTypes.ObjectExpression[];
    for (const route of routes) {
        for (const property of route.properties) {
            if (property.type == 'Property' && property.key.type == 'Identifier' && property.key.name == 'component') {
                const originalId = property.value as namedTypes.Identifier;
                property.value = createRouteImportArrowFn(componentVariableMap[originalId.name], fileName);
            }
        }
    }

    // 添加webpackChunkName

    generatedAst.program.body.push(...importDeclarations);
    generatedAst.program.body.push(exportDefaultDeclaration);
    const code = recast.print(generatedAst, {
        tabWidth: 4,
    }).code;
    fs.writeFileSync(output, code);
}