const { builders: b } = require('ast-types');
const b_ = require('./b');
const extract = require('./extract');

exports.importModuleFromVuex = b.importDeclaration(
    [b.importSpecifier(b.identifier('Module'))],
    b.literal('vuex'),
);
exports.importRootStateFromStoreDTS = b.importDeclaration(
    [b.importSpecifier(b.identifier('RootState'))],
    b.literal('@/types/store'),
);
exports.exportDefaultM = b.exportDefaultDeclaration(b.identifier('m'));
exports.camcelCaseWithFirstLetter = function(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1).replace(/[-_][a-z0-9]/g, (c) => c.substr(1).toUpperCase());
}
exports.addStore = function(memberExpression) {
    let exp = memberExpression;
    let parent = null;
    while (exp.object.type === 'MemberExpression') {
        parent = exp;
        exp = exp.object;
    }
    // 这是exp.type是identifier
    parent.object = b.memberExpression(b.identifier('store'), exp, false);
    return memberExpression;
}

module.exports = {
    ...exports,
    ...b_,
    ...extract,
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