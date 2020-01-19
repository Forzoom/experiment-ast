const recast = require('recast');
const babelParser = require('@babel/parser');
const tsParser = require('@typescript-eslint/typescript-estree');
// 问题在于esprima无法识别decorator
const code = [
    'class T {',
    ' public a() {}',
    '}',
].join('\n');

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
console.log(ast.program.body[0].body.body);
