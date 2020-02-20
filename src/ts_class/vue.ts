import * as recast from 'recast';
import fs from 'fs';
import path from 'path';
// 尝试自定义扩展ast-types的定义
import { builders as b, namedTypes } from 'ast-types';
import * as K from 'ast-types/gen/kinds';
import * as parser from '@babel/parser';
import {
    Extract,
    parseMemberExpression,
    formatMemberExpression,
    importFromVuePropertyDecorator,
    camelCaseWithDollar,
    any,
    getScriptContent,
} from '@/utils';
import { VueNode, DataNode, PropNode, ComputedNode, WatchNode, MethodNode } from '@/gen/node';

/**
 * 对于vue文件进行处理
 */
export default function(input: string, output: string) {
    console.info(input, output);
    const extname = path.extname(input);
    if (extname !== '.vue') {
        console.warn(input + ' isnt a vue file');
        return;
    }
    const originalCode = fs.readFileSync(input, 'utf-8');
    const scriptContent = getScriptContent(originalCode);
    if (!scriptContent) {
        console.warn(input + ' script is lost');
        return;
    }

    const originalAst = recast.parse(scriptContent.jsScript, {
        parser: {
            parse(source: string, options: any) {
                return parser.parse(source, Object.assign(options, {
                    plugins: [
                        'estree',
                        'decorators-legacy',
                        'typescript',
                        'classProperties',
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

    // 寻找class的导出
    const body = originalAst.program.body as namedTypes.Node[];
    let classDeclaration: namedTypes.ClassDeclaration | null = null;
    let importDeclarations: namedTypes.ImportDeclaration[] = [];
    let other: namedTypes.Node[] = [];
    for (const node of body) {
        if (node.type === 'ClassDeclaration') {
            classDeclaration = node as namedTypes.ClassDeclaration;
        } else if (node.type === 'ImportDeclaration') {
            importDeclarations.push(node as namedTypes.ImportDeclaration);
        } else {
            other.push(node);
        }
    }

    if (!classDeclaration || !classDeclaration.decorators) {
        console.warn('cannot find class declaration');
        return;
    }

    // 寻找所有的变量定义
    const componentArgument = ((classDeclaration.decorators[0].expression as namedTypes.CallExpression).arguments[0] as namedTypes.ObjectExpression);
    let className: string | null = null;
    let componentsList: namedTypes.Property | null = null;
    for (const property of componentArgument.properties as namedTypes.Property[]) {
        const name = (property.key as namedTypes.Identifier).name;
        if (name === 'name') {
            className = (property.value as namedTypes.StringLiteral).value;
        } else if (name === 'components') {
            componentsList = property;
        }
    }
    const propNodes: PropNode[] = [];
    const dataNodes: DataNode[] = [];
    const computedNodes: ComputedNode[] = [];
    const watchNodes: WatchNode[] = [];
    const methodNodes: MethodNode[] = [];

    for (const item of classDeclaration.body.body) {
        if (item.type === 'ClassProperty') {
            if (item.decorators) {
                // Prop
                const node = new PropNode((item.key as namedTypes.Identifier).name, (item.decorators[0].expression as namedTypes.CallExpression).arguments[0]);
                node.comments = item.comments;
                propNodes.push(node);
            } else {
                // data
                const node = new DataNode((item.key as namedTypes.Identifier).name, item.value);
                node.comments = item.comments;
                dataNodes.push(node);
            }
        } else if (item.type === 'MethodDefinition') {
            if (item.kind === 'get') {
                // computed
                const node = new ComputedNode((item.key as namedTypes.Identifier).name, item.value as namedTypes.FunctionExpression);
                node.comments = item.comments;
                computedNodes.push(node);
            } else {
                if (item.decorators) {
                    // watch
                    const name = (item.decorators[0].expression as namedTypes.CallExpression).arguments[0] as namedTypes.StringLiteral;
                    const node = new WatchNode(name.value, item.value as namedTypes.FunctionExpression);
                    node.comments = item.comments;
                    watchNodes.push(node);
                } else {
                    // method
                    const node = new MethodNode((item.key as namedTypes.Identifier).name, item.value as namedTypes.FunctionExpression);
                    node.comments = item.comments;
                    methodNodes.push(node);
                }
            }
        }
    }

    const vueNode = new VueNode(className!);
    vueNode.props = propNodes;
    vueNode.data = dataNodes;
    vueNode.computed = computedNodes;
    vueNode.watch = watchNodes;
    vueNode.methods = methodNodes;
}