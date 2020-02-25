const recast = require('recast');
const { builders: b } = require('ast-types');
const parser = require('@babel/parser');
const originalCode = `
    export default {
        computed: {
            fn1() {

            },
            fn2() {

            },
        },
    }
`;

const generateCode = `
    @Component({
        name: 'MyComponent',
    })
    export default class MyComponent extends Vue {

    }
`;

const originalAst = recast.parse(originalCode);
const generateAst = recast.parse(generateCode, {
    parser: {
        parse(source, options) {
            return parser.parse(source, Object.assign(options, {
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

const computedNodes = originalAst.program.body[0].declaration.properties[0].value.properties.map((property) => {
    const declaration = b.methodDefinition('get', property.key, property.value);
    declaration.accessibility = 'public';
    declaration.comments = this.comments;
    return declaration;
});
console.log(generateAst.program.body[0].declaration);
generateAst.program.body[0].declaration.body.body.push(...computedNodes);
const resultCode = recast.print(generateAst).code;

console.log(resultCode);