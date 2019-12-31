require('./toTS/polyfill');
const recast = require('recast');
const tsParser = require('@typescript-eslint/typescript-estree');
const handleStore = require('./toTS/store');
const handleVue = require('./toTS/vue');
const fs = require('fs');

// handleStore('./assets/address1.js', './assets/address1.ts');
handleVue('./assets/mine.vue', './assets/mine1.vue');
