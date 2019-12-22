const { builders: b } = require('ast-types');

exports.importModuleFromVuex = b.importDeclaration(
    [b.importSpecifier(b.identifier('Module'))],
    b.literal('vuex'),
);
exports.importRootStateFromStoreDTS = b.importDeclaration(
    [b.importSpecifier(b.identifier('RootState'))],
    b.literal('@/types/store'),
);
exports.exportDefaultM = b.exportDefaultDeclaration(b.identifier('m'));
const tsPropertySignature = exports.tsPropertySignature = function(id, reference) {
    return b.tsPropertySignature(b.identifier(id), b.tsTypeAnnotation(b.tsTypeReference(b.identifier(reference))));
}

/**
 * 使用闭包形式
 */
exports.extractStatePropertySignature = function(p) {
    const list = [];
    return {
        list,
        factory(p) {
            if (p.value) {
                const parentPath1 = p.parentPath;
                if (parentPath1) {
                    const parentPath2 = parentPath1.parentPath;
                    if (parentPath2.value.type === 'ObjectExpression') {
                        const parentPath3 = parentPath2.parentPath;
                        if (parentPath3) {
                            const key = parentPath3.value.key;
                            if (key && key.name === 'state') {
                                list.push(
                                    tsPropertySignature(p.value.key.name, 'any')
                                );
                            }
                        }
                    }
                }
            }
        },
    };
}

exports.camcelCaseWithFirstLetter = function(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1).replace(/[-_][a-z0-9]/g, (c) => c.substr(1).toUpperCase());
}

// type Id = number
// const node = b.tsTypeAliasDeclaration(b.identifier('Id'), b.tsNumberKeyword())

// const m: m = {}
// const m = b.identifier('m');
// m.typeAnnotation = b.tsTypeAnnotation(b.tsTypeReference(b.identifier('m')));
// const node = b.variableDeclaration('var', [
//     b.variableDeclarator(
//         m,
//         null,
//     )
// ])