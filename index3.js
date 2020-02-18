const fs = require('fs');
const recast = require('recast');
const b = require('ast-types').builders;
const babelParser = require('@babel/parser');
const tsParser = require('@typescript-eslint/typescript-estree');
// 问题在于esprima无法识别decorator
const code = [
    `const fn = () => import('test')`,
].join('\n');
// const code = fs.readFileSync('./assets/router.js', 'utf8');

const ast = recast.parse(code, {
    parser: tsParser,
    // parser: {
    //     parse(source, options) {
    //         return babelParser.parse(source, Object.assign(options, {
    //             plugins: [
    //                 'estree',
    //                 'decorators-legacy',
    //                 'classProperties',
    //             ],
    //             tokens: true,
    //         }))
    //     },
    // },
});
// console.log(ast.program.body[1].declarations[0].init.body.body[0].expression.arguments[1].body.body[0].expression.arguments[0].arguments[0].value);
// console.log(ast.program.body[1].declarations[0].init.body.body[0].expression.arguments[1].body.body[0].type);
console.log(ast.program.body[0].declarations[0].init);

// function createRouteImportArrowFn(filepath, webpackChunkName) {
//     return b.arrowFunctionExpression(
//         [],
//         b.callExpression(b.import(), [ b.stringLiteral(filepath) ]),
//     );
// }

// ast.program.body.push(createRouteImportArrowFn('filepath'));

// console.log(recast.print(ast).code);
