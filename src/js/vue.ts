import * as recast from 'recast';
import fs from 'fs';
import path from 'path';
// 尝试自定义扩展ast-types的定义
import { builders as b, namedTypes } from 'ast-types';
import * as K from 'ast-types/gen/kinds';
import * as parser from '@babel/parser';
import {
    Extract,
    importFromVuePropertyDecorator,
    getScriptContent,
} from '@/utils';
import {
    DataNode, ComputedNode, PropNode, MethodNode, WatchNode, VueNode,
} from '@/gen/node';
import plugin from '@/gen/plugins/addParamsTypeAnnotation';

const routerLifecycleNames = [ 'beforeRouteEnter', 'beforeRouteUpdate', 'beforeRouteLeave' ];
const lifecycleNames = [ 'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed' ].concat(routerLifecycleNames);
const importDeclarationMap: {
    [source: string]: namedTypes.ImportDeclaration,
} = {};

function handleImport(imports: namedTypes.ImportDeclaration[]) {
    imports.forEach((importDeclaration) => {
        if (importDeclaration.source.type === 'Literal' && typeof importDeclaration.source.value == 'string') {
            importDeclaration.source.value = (importDeclaration.source.value as string).replace(/\.js$/, '');
            importDeclarationMap[importDeclaration.source.value] = importDeclaration;
        }
    });
}

function handleProp(props: namedTypes.Property) {
    const objectExpression = props.value as namedTypes.ObjectExpression;
    return (objectExpression.properties as namedTypes.ObjectProperty[]).map((property) => {
        const node = new PropNode((property.key as namedTypes.Identifier).name, property.value);
        node.comments = property.comments;
        return node;
    });
}

function handleData(data: namedTypes.Property) {
    const functionExpression = data.value as namedTypes.FunctionExpression;
    const returnStatement = functionExpression.body.body[0] as namedTypes.ReturnStatement;
    const objectExpression = returnStatement.argument as namedTypes.ObjectExpression;
    const properties = objectExpression.properties as namedTypes.ObjectProperty[];

    return properties.map((property) => {
        const node = new DataNode((property.key as namedTypes.Identifier).name, property.value)
        node.comments = property.comments;
        return node;
    });
}

function handleComputed(computed: namedTypes.Property) {
    const result: ComputedNode[] = [];
    const objectExpression = computed.value as namedTypes.ObjectExpression;
    (objectExpression.properties as Array<namedTypes.Property | namedTypes.SpreadElement>).forEach((property) => {
        if (property.type === 'SpreadElement') {
            const l: ComputedNode[] = [];
            if (property.argument.type === 'CallExpression') {
                let namespace: string = '';
                for (const argument of property.argument.arguments) {
                    if (argument.type === 'Literal') {
                        namespace = (argument.value as string);
                    } else if (argument.type === 'ObjectExpression') {
                        // 这是所有的内容
                        for (const property of argument.properties as namedTypes.Property[]) {
                            const node = new ComputedNode((property.key as namedTypes.Identifier).name, property.value as (namedTypes.FunctionExpression | namedTypes.ArrowFunctionExpression));
                            node.store = true;
                            node.storeNamespace = namespace;
                            node.comments = property.comments;
                            l.push(node);
                        }
                    }
                }
            }
            result.push(...l);
        } else if (property.type === 'Property') {
            const node = new ComputedNode((property.key as namedTypes.Identifier).name, property.value as namedTypes.FunctionExpression);
            node.comments = property.comments;
            result.push(node);
        }
    });
    return result;
}

function handleMethod(methods: namedTypes.Property[]) {
    return methods.map(method => {
        if (method.value.type === 'FunctionExpression') {
            const node = new MethodNode((method.key as namedTypes.Identifier).name, method.value);
            node.comments = method.comments;
            return node;
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

        const node = new WatchNode(propertyName, method);
        node.comments = property.comments;
        return node;
    });
}

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

    let originalExportDefault: namedTypes.ExportDefaultDeclaration | null = null;
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
        visitProperty(p) {
            const property = p.value as namedTypes.Property;
            if (property.key && property.key.type === 'Identifier') {
                const name = property.key.name;
                if (lifecycleNames.indexOf(name) >= 0) {
                    const declaration = b.methodDefinition('method', property.key as namedTypes.Identifier, property.value as namedTypes.FunctionExpression);
                    declaration.accessibility = 'public';
                    declaration.comments = property.comments;
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
            originalExportDefault = item as namedTypes.ExportDefaultDeclaration;
        } else {
            other.push(item);
        }
    });

    handleImport(importDeclarations);
    console.info('handle import done!');

    if (!name) {
        console.warn('lost name');
        return;
    }
    /** 类名，大写开头 */
    const className = (name.value as namedTypes.StringLiteral).value;

    // 如果存在props，处理props
    let propDefinitions: namedTypes.ClassProperty[] = [];
    let propNodes: PropNode[] = [];
    if (props) {
        propNodes = handleProp(props);
        propDefinitions = propNodes.map((node) => node.toTsClass());
    }
    console.info('handle props done!');

    // 处理data
    let dataDefinitions: namedTypes.ClassProperty[] = [];
    let dataNodes: DataNode[] = [];
    if (dataFunc) {
        dataNodes = handleData(dataFunc);
        dataDefinitions = dataNodes.map((node) => node.toTsClass());
    }
    console.info('handle data done!');

    // 处理computed
    let computedDefinitions: namedTypes.MethodDefinition[] = [];
    let computedNodes: ComputedNode[] = [];
    if (computed) {
        computedNodes = handleComputed(computed);
        computedDefinitions = computedNodes.map((node) => node.toTsClass());
    }
    console.info('handle computed done!');

    // 处理method
    let methodDefinitions: namedTypes.MethodDefinition[] = [];
    let methodNodes: MethodNode[] = [];
    if (methods) {
        methodNodes = handleMethod((methods.value as namedTypes.ObjectExpression).properties as namedTypes.Property[]).filter(_ => _) as MethodNode[];
        methodDefinitions = methodNodes.map((node) => node.toTsClass());
    }
    console.info('handle methods done!');

    // 处理watch
    let watchDefinitions: namedTypes.TSDeclareMethod[] = []
    let watchNodes: WatchNode[] = [];
    if (watchList) {
        watchNodes = handleWatch((watchList.value as namedTypes.ObjectExpression).properties as namedTypes.Property[]);
        watchDefinitions = watchNodes.map((node) => node.toTsClass());
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
    if (originalExportDefault) {
        exportDefault.comments = (originalExportDefault as namedTypes.ExportDefaultDeclaration).comments;
    }

    // 处理vue-property-decorator
    const importFromVPD = importFromVuePropertyDecorator([
        props && (props.value as namedTypes.ObjectExpression).properties.length > 0 ? 'Prop' : null,
        watchDefinitions.length > 0 ? 'Watch' : null,
    ]);

    const vueNode = new VueNode();
    vueNode.originalAst = originalAst;
    vueNode.imports = importDeclarations;
    vueNode.prop = propNodes;
    vueNode.data = dataNodes;
    vueNode.computed = computedNodes;
    vueNode.watch = watchNodes;
    vueNode.methods = methodNodes;
    plugin(vueNode);

    generatedAst.program.body.push(...importDeclarations, importFromVPD, ...other);
    generatedAst.program.body.push(exportDefault);
    const code = scriptContent.header + '\n' + recast.print(generatedAst, { tabWidth: 4 }).code + '\n' + scriptContent.footer;
    
    fs.writeFileSync(output, code);
}
