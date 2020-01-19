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

/**
 * @param extra string[]
 */
exports.importFromVuePropertyDecorator = (extra) => {
    return b.importDeclaration(
        [
            b.importSpecifier(b.identifier('Component')),
            b.importSpecifier(b.identifier('Vue')),
            ...extra.filter((_) => _).map((name) => b.importSpecifier(b.identifier(name))),
        ],
        b.literal('vue-property-decorator'),
    );
}
exports.exportDefaultM = b.exportDefaultDeclaration(b.identifier('m'));
const camelCaseWithFirstLetter = exports.camelCaseWithFirstLetter = function(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1).replace(/[-_][a-z0-9]/g, (c) => c.substr(1).toUpperCase());
}
/**
 * 用于处理 $props.value 这样的属性内容
 */
exports.camelCaseWithDollar = (str) => {
    if (str[0] === '$') {
        str = str.substr(1);
    }
    return str.split('.').map(part => camelCaseWithFirstLetter(part)).join('');
}
// 解析
exports.parseMemberExpression = function(exp) {
    if (exp.type !== 'MemberExpression') {
        console.error(exp, ' is not a MemberExpression');
        return;
    }
    const result = [ exp.property.name ];
    let _exp = exp;
    while (_exp.object.type === 'MemberExpression') {
        _exp = _exp.object;
        result.unshift(_exp.property.name);
    }
    result.unshift(_exp.object.name);
    return result;
}

exports.formatMemberExpression = function(list) {
    console.log(list);
    const last = list.pop();
    let exp = b.identifier(last);
    for (let i = list.length - 1; i >= 0; i--) {
        const name = list[i];
        exp = b.memberExpression(b.identifier(name), exp, false);
    }
    return exp;
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