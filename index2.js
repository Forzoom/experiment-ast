require('./toTS/polyfill');
const recast = require('recast');
const tsParser = require('@typescript-eslint/typescript-estree');
const handleStore = require('./toTS/store');
const handleVue = require('./toTS/vue');
const fs = require('fs');

// handleStore('./assets/address1.js', './assets/address1.ts');
// handleVue('./assets/mine.vue', './assets/mine1.vue');

const originalCode = fs.readFileSync('./assets/userHome.vue', 'utf-8');
const startPos = originalCode.indexOf('<script lang="ts">');
const endPos = originalCode.indexOf('</script>');
const jsScript = originalCode.substr(startPos + 18, endPos - startPos - 18);
console.log('target1', jsScript);
const ast = recast.parse(jsScript, {
    parser: tsParser,
});

console.log(ast.program);
