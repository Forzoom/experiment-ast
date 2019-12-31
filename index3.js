const recast = require('recast');
const parser = require('@babel/parser');
// 问题在于esprima无法识别decorator
const code = [
    '@Test()',
    'class Test {',
    '',
    '}',
].join('\n');

const ast = recast.parse(code, {
    parser: {
        parse(source, options) {
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
console.log(ast.program.body[0].decorators[0]);

console.log(recast.print(ast).code);
