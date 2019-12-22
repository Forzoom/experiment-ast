const recast = require('recast');
const fs = require('fs');
const path = require('path');
// 尝试自定义扩展ast-types的定义
const { Type, builtInTypes, builders: b, finalize } = require('ast-types');
const { def } = Type;
const { string } = builtInTypes;
const tsParser = require('@typescript-eslint/typescript-estree');
const {
    importModuleFromVuex,
    importRootStateFromStoreDTS,
    exportDefaultM,
    extractStatePropertySignature,
    camcelCaseWithFirstLetter,
} = require('./utils');

/**
 * 对于vue文件进行处理
 */
module.exports = function(input, output) {
    const extname = path.extname(input);
    if (extname !== '.vue') {
        console.warn(input + ' isnt a vue file');
        return;
    }
    const originalCode = fs.readFileSync(input);
}