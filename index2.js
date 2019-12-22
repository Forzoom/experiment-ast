const recast = require('recast');
const fs = require('fs');
const originalCode = fs.readFileSync('./assets/address.ts');
// 尝试自定义扩展ast-types的定义
const { Type, builtInTypes, builders: b, finalize } = require('ast-types');
const { def } = Type;
const { string } = builtInTypes;
const tsParser = require('@typescript-eslint/typescript-estree');
const {
    importModuleFromVuex,
    importRootStateFromStoreDTS,
    exportDefaultM,
    tsPropertySignature,
    extractStatePropertySignature,
} = require('./toTS/index');

// recast无法处理ts语法
const originalAst = recast.parse(originalCode, {
    parser: tsParser,
});
const generatedAst = recast.parse(''); // program这个内容，但是没有body，在body中会有ImportDeclaration和ExportDefaultDeclaration内容
const importDeclarations = [];
const {
    list: interfacePropertyList,
    factory: interfacePropertyFactory,
} = extractStatePropertySignature();
let moduleObject = null;

// 对于store进行处理
recast.visit(originalAst, {
    // 处理import
    visitImportDeclaration(d) {
        importDeclarations.push(d.value);
        this.traverse(d);
    },
    // 处理object
    visitExportDefaultDeclaration(d) {
        moduleObject = d.value.declaration;
        this.traverse(d);
    },
    // 使用state内容来生成interface
    visitProperty(p) {
        interfacePropertyFactory(p);
        this.traverse(p);
    },
});
const identifierM = b.identifier('m');
identifierM.typeAnnotation = b.tsTypeAnnotation(b.tsTypeReference(b.identifier('Module<AddressState, RootState>')));
const moduleDeclarationNode = b.variableDeclaration(
    'const',
    [
        b.variableDeclarator(identifierM, moduleObject)
    ]
);

const exportStateNode = b.exportNamedDeclaration(
    b.tsInterfaceDeclaration(
        b.identifier('AddressState'),
        b.tsInterfaceBody(interfacePropertyList)
    ),
    [],
    null
);

generatedAst.program.body.push(...importDeclarations, importModuleFromVuex, importRootStateFromStoreDTS);
generatedAst.program.body.push(exportStateNode);
generatedAst.program.body.push(moduleDeclarationNode);
generatedAst.program.body.push(exportDefaultM);
const code = recast.print(generatedAst).code;
fs.writeFileSync('./assets/address1.ts', code);
