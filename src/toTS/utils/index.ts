import { builders as b, namedTypes } from 'ast-types';
export * from './b';
export * from './export';
export * from './extract';
export * from './import';
export * from './string';

// 解析
export function parseMemberExpression(exp: namedTypes.MemberExpression) {
    if (exp.type !== 'MemberExpression') {
        console.error(exp, ' is not a MemberExpression');
        return [];
    }
    const result = [ (exp.property as namedTypes.Identifier).name ];
    let _exp = exp;
    while (_exp.object.type === 'MemberExpression') {
        _exp = _exp.object;
        result.unshift((_exp.property as namedTypes.Identifier).name);
    }
    result.unshift((_exp.object as namedTypes.Identifier).name);
    return result;
}

export function formatMemberExpression(list: string[]) {
    const last = list.pop();
    let exp: any = b.identifier(last!);
    for (let i = list.length - 1; i >= 0; i--) {
        const name = list[i];
        exp = b.memberExpression(b.identifier(name), exp, false);
    }
    return exp;
}

export function isDef(val: any): val is (undefined | null) {
    return val != null;
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