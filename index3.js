const recast = require('recast');
const code = [
    'function test() {',
    'return 1 + 2',
    '}',
].join('\n');

const ast = recast.parse(code);
console.log(ast.program.body[0].body.loc.lines);

console.log(recast.print(ast).code);
