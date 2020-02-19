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
    const generatedAst = recast.parse(''); // program这个内容，但是没有body，在body中会有ImportDeclaration和ExportDefaultDeclaration内容
    const interfaceName = camelCaseWithFirstLetter(fileName) + 'State';
    const importDeclarations: namedTypes.ImportDeclaration[] = [];
    let moduleObject: namedTypes.ObjectExpression | null = null;
    
    // 对于store进行处理
    recast.visit(originalAst, {
        // 处理import
        visitImportDeclaration(d) {
            importDeclarations.push(d.value);
            this.traverse(d);
        },
        // 处理object
        visitExportDefaultDeclaration(d) {
            moduleObject = d.value.declaration as namedTypes.ObjectExpression;
            this.traverse(d);
        },
    });

    if (!moduleObject || moduleObject!.type !== 'ObjectExpression') {
        console.info('cannot find module object');
        return;
    }

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
    
    const exportStateNode = b.exportNamedDeclaration(
        b.tsInterfaceDeclaration(
            b.identifier(interfaceName),
            b.tsInterfaceBody(interfacePropertyList)
        ),
        [],
        null
    );
    
    generatedAst.program.body.push(...importDeclarations, importModuleFromVuex, importRootStateFromStoreDTS);
    generatedAst.program.body.push(exportStateNode);
    generatedAst.program.body.push(moduleDeclarationNode);
    generatedAst.program.body.push(exportDefaultM);
    const code = recast.print(generatedAst, {
        tabWidth: 4,
    }).code;
    fs.writeFileSync(output, code);
}
