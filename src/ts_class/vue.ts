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
    topLevelNames,
} from '@/utils';
import { VueNode, DataNode, PropNode, ComputedNode, WatchNode, MethodNode, LifecycleNode } from '@/gen/node';

/**
 * 对于vue文件进行处理
 */
export default function(input: string, output: string) {
    console.info(input, output);
    const extname = path.extname(input);
    if (extname !== '.vue' && extname !== '.ts') {
        console.warn(input + ' isnt a vue/ts file');
        return;
    }
    const originalCode = fs.readFileSync(input, 'utf-8');
    let scriptContent: { header: string, footer: string, jsScript: string } | null = null;
    if (extname === '.vue') {
        scriptContent = getScriptContent(originalCode);
    } else {
        scriptContent = {
            header: '',
            footer: '',
            jsScript: originalCode,
        };
    }
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

    recast.visit(originalAst, {
        visitFunctionExpression(p) {
            (p.value as namedTypes.FunctionExpression).params.forEach(param => {
                if (param.type === 'Identifier') {
                    param.typeAnnotation = null;
                } else if (param.type === 'ObjectPattern') {
                    param.typeAnnotation = null;
                }
            });
            this.traverse(p);
        },
        visitArrowFunctionExpression(p) {
            (p.value as namedTypes.ArrowFunctionExpression).params.forEach(param => {
                if (param.type === 'Identifier') {
                    param.typeAnnotation = null;
                } else if (param.type === 'ObjectPattern') {
                    param.typeAnnotation = null;
                }
            });
            this.traverse(p);
        },
        visitVariableDeclarator(p) {
            const declarator = p.value as namedTypes.VariableDeclarator;
            const init = declarator.init;
            if (init && init.type === 'TSAsExpression') {
                declarator.init = init.expression;
            }
            this.traverse(p);
        },
        visitMemberExpression(p) {
            const expression = p.value as namedTypes.MemberExpression;
            if (expression.object.type === 'TSNonNullExpression') {
                expression.object = expression.object.expression;
            }
            this.traverse(p);
        },
        visitIdentifier(p) {
            const identifier = p.value as namedTypes.Identifier;
            if (identifier.typeAnnotation) {
                identifier.typeAnnotation = null;
            }
            this.traverse(p);
        },
    });

    // 寻找class的导出
    const body = originalAst.program.body as namedTypes.Node[];
    let exportDefaultDeclaration: namedTypes.ExportDefaultDeclaration | null = null;
    let importDeclarations: namedTypes.ImportDeclaration[] = [];
    let other: namedTypes.Node[] = [];
    for (const node of body) {
        if (node.type === 'ExportDefaultDeclaration') {
            exportDefaultDeclaration = node as namedTypes.ExportDefaultDeclaration;
        } else if (node.type === 'ImportDeclaration') {
            importDeclarations.push(node as namedTypes.ImportDeclaration);
        } else {
            other.push(node);
        }
    }

    if (!exportDefaultDeclaration) {
        console.warn('cannot find export default');
        return;
    }
    const classDeclaration: namedTypes.ClassDeclaration | null = exportDefaultDeclaration.declaration as namedTypes.ClassDeclaration;
    if (!classDeclaration.decorators) {
        console.warn('cannot find class decorators');
        return;
    }

    // 寻找所有的变量定义
    const componentArgument = ((classDeclaration.decorators[0].expression as namedTypes.CallExpression).arguments[0] as namedTypes.ObjectExpression);
    let className: string | null = null;
    let components: namedTypes.Property | null = null;
    let filters: namedTypes.Property | null = null;
    let directives: namedTypes.Property | null = null;
    let mixins: namedTypes.Property | null = null;
    for (const property of componentArgument.properties as namedTypes.Property[]) {
        const name = (property.key as namedTypes.Identifier).name;
        if (name === 'name') {
            className = (property.value as namedTypes.StringLiteral).value;
        } else if (name === 'components') {
            components = property;
        } else if (name === 'filters') {
            filters = property;
        } else if (name === 'directives') {
            directives = property;
        } else if (name === 'mixins') {
            mixins = property;
        }
    }
    const propNodes: PropNode[] = [];
    const dataNodes: DataNode[] = [];
    const computedNodes: ComputedNode[] = [];
    const watchNodes: WatchNode[] = [];
    const methodNodes: MethodNode[] = [];
    const lifecycleNodes: LifecycleNode[] = [];

    for (const item of classDeclaration.body.body) {
        if (item.type === 'ClassProperty') {
            if (item.decorators) {
                // Prop
                const args = (item.decorators[0].expression as namedTypes.CallExpression).arguments;
                const type = args ? args[0] : null;
                const node = new PropNode((item.key as namedTypes.Identifier).name, type);
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
                    const name = (item.key as namedTypes.Identifier).name;
                    if (topLevelNames.indexOf(name) >= 0) {
                        // lifecycle
                        const node = new LifecycleNode(name, item.value as namedTypes.FunctionExpression);
                        node.comments = item.comments;
                        lifecycleNodes.push(node);
                    } else {
                        // method
                        const node = new MethodNode(name, item.value as namedTypes.FunctionExpression);
                        node.comments = item.comments;
                        methodNodes.push(node);
                    }
                }
            }
        }
    }

    const vueNode = new VueNode(className!);
    vueNode.imports = importDeclarations;
    vueNode.components = components;
    vueNode.filters = filters;
    vueNode.directives = directives;
    vueNode.mixins = mixins;
    vueNode.props = propNodes;
    vueNode.data = dataNodes;
    vueNode.computed = computedNodes;
    vueNode.watch = watchNodes;
    vueNode.methods = methodNodes;
    vueNode.lifecycles = lifecycleNodes;

    generatedAst.program.body.push(...vueNode.imports, ...other);
    generatedAst.program.body.push(vueNode.toJs());
    let code: string = '';
    if (extname === '.vue') {
        code = scriptContent.header + '\n<script>\n' + recast.print(generatedAst, { tabWidth: 4 }).code + '\n</script>\n' + scriptContent.footer;
    } else {
        code = recast.print(generatedAst, { tabWidth: 4 }).code;
    }
    
    fs.writeFileSync(output, code);
}