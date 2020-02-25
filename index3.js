const fs = require('fs');
const recast = require('recast');
const b = require('ast-types').builders;
const babelParser = require('@babel/parser');
const tsParser = require('@typescript-eslint/typescript-estree');
// 问题在于esprima无法识别decorator
const code = [
    `
        const a = {
            computed: {
                'fn'() {}
            }
        }
    `,
].join('\n');
// const code = fs.readFileSync('./assets/router.js', 'utf8');

const ast = recast.parse(code, {
    // parser: tsParser,
    parser: {
        parse(source, options) {
            return babelParser.parse(source, Object.assign(options, {
                plugins: [
                    'estree',
                    'decorators-legacy',
                    'typescript',
                    'classProperties',
                ],
                tokens: true,
            }))
        },
    },
});

ast.program.body.push(b.line(''));
const gen = recast.print(ast).code;

console.log(`|${gen}|`);

// console.log(ast.program.body[1].declarations[0].init.body.body[0].expression.arguments[1].body.body[0].expression.arguments[0].arguments[0].value);
// console.log(ast.program.body[1].declarations[0].init.body.body[0].expression.arguments[1].body.body[0].type);
// console.log(ast.program.body[0].declarations[0].init.properties[0].value.properties[0]);

// function createRouteImportArrowFn(filepath, webpackChunkName) {
//     return b.arrowFunctionExpression(
//         [],
//         b.callExpression(b.import(), [ b.stringLiteral(filepath) ]),
//     );
// }

// ast.program.body.push(createRouteImportArrowFn('filepath'));

// console.log(recast.print(ast).code);
