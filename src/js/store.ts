import * as recast from 'recast';
import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import {
    importModuleFromVuex,
    importRootStateFromStoreDTS,
    exportDefaultM,
    camelCaseWithFirstLetter,
    tsPropertySignature,
} from '@/utils/index';
// 尝试自定义扩展ast-types的定义
import { builders as b, namedTypes } from 'ast-types';

function handleModule(interfaceName: string, moduleObject: namedTypes.ObjectExpression) {
    // 使用state生成interface
    let interfacePropertyList: namedTypes.TSPropertySignature[] = [];
    const stateList = moduleObject!.properties.filter(property => property.type === 'Property' && property.value.type === 'ObjectExpression' && property.key.type === 'Identifier' && property.key.name === 'state')
    if (stateList.length == 1) {
        const state = stateList[0] as namedTypes.Property;
        const properties = (state.value as namedTypes.ObjectExpression).properties as namedTypes.Property[];
        interfacePropertyList = properties.map(item => {
            const signature = tsPropertySignature((item.key as namedTypes.Identifier).name, 'any');
            signature.comments = item.comments;
            return signature;
        });
    }

    const identifierM = b.identifier('m');
    identifierM.typeAnnotation = b.tsTypeAnnotation(b.tsTypeReference(b.identifier(`Module<${interfaceName}, RootState>`)));
    const moduleDeclarationNode = b.variableDeclaration(
        'const',
        [
            b.variableDeclarator(identifierM, moduleObject)
        ]
    );
    
    // ModuleState
    const exportStateNode = b.exportNamedDeclaration(
        b.tsInterfaceDeclaration(
            b.identifier(interfaceName),
            b.tsInterfaceBody(interfacePropertyList)
        ),
        [],
        null
    );

    return [
        exportStateNode,
        moduleDeclarationNode,
    ];
}

/**
 * 对于store文件进行处理
 */
export default function(input: string, output: string) {
    console.info(input, output);
    const extname = path.extname(input);
    if (extname !== '.js') {
        console.warn(input + ' isnt a js file');
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
    const interfaceName = camelCaseWithFirstLetter(fileName) + 'State';
    const importDeclarations: namedTypes.ImportDeclaration[] = [];
    const body = originalAst.program.body;
    let exportDefaultDeclaration: namedTypes.ExportDefaultDeclaration | null = null;
    let moduleObject: namedTypes.ObjectExpression | null = null;
    const other: namedTypes.Node[] = [];
    
    for (const node of body as namedTypes.Node[]) {
        if (node.type === 'ImportDeclaration') {
            importDeclarations.push(node as namedTypes.ImportDeclaration);
        } else if (node.type === 'ExportDefaultDeclaration') {
            exportDefaultDeclaration = node as namedTypes.ExportDefaultDeclaration;
        } else {
            other.push(node);
        }
    }
    
    if (!exportDefaultDeclaration) {
        console.warn('cannot find export default declaration');
        return;
    }

    const declaration = exportDefaultDeclaration.declaration;
    if (declaration.type === 'ObjectExpression') {
        moduleObject = declaration as namedTypes.ObjectExpression;

        const nodes = handleModule(interfaceName, moduleObject);
        const generatedAst = recast.parse(''); // program这个内容，但是没有body，在body中会有ImportDeclaration和ExportDefaultDeclaration内容
        generatedAst.program.body.push(...importDeclarations, importModuleFromVuex, importRootStateFromStoreDTS);
        generatedAst.program.body.push(...other);
        generatedAst.program.body.push(...nodes);
        generatedAst.program.body.push(exportDefaultM);
        const code = recast.print(generatedAst, {
            tabWidth: 4,
        }).code;
        fs.writeFileSync(output, code);
    } else {
        fs.writeFileSync(output, originalCode);
    }
}
