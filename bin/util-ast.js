var process = require('process');
var util = require('../dist/bundle.js');
var test = require('../dist/bundle.js');
// var fs = require('fs');
console.log(require.r);
// var argv = process.argv;
// var cmd = argv[2];
// var src = argv[3];
// var dist = argv[4];

// console.log(util, util.test, util.__esModule, util.default, util.handleVueFileLess, cmd, src, dist);

// // 操作处理
// if (cmd === 'handleVueFileLess') {
//     util.handleVueFileLess(src, dist);
// }

// import util from './dist/bundle.js';

console.log(util, test, util.a);
