import { builders as b } from 'ast-types';
export * from './b';
export * from './export';
export * from './extract';
export * from './import';
export * from './string';

// 解析
export function parseMemberExpression(exp) {
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

export function formatMemberExpression(list) {
    console.log(list);
    const last = list.pop();
    let exp: any = b.identifier(last);
    for (let i = list.length - 1; i >= 0; i--) {
        const name = list[i];
        exp = b.memberExpression(b.identifier(name), exp, false);
    }
    return exp;
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