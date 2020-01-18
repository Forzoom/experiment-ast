require('./toTS/polyfill');
const recast = require('recast');
const tsParser = require('@typescript-eslint/typescript-estree');
const handleStore = require('./toTS/store');
const handleVue = require('./toTS/vue');
const fs = require('fs');
const path = require('path');

// handleStore('./assets/address1.js', './assets/address1.ts');
// handleVue('./assets/mine.vue', './assets/mine1.vue');

const dir = '/Volumes/Repo2/repo/vue/tourye_web_ts/src';
const dist = '/Volumes/Repo2/repo/vue/tourye_web_ts_ast/src';
const componentDir = dir + '/components';
const featureDir = dir + '/features';
const pageDir = dir + '/pages';
const storeDir = dir + '/store';
const queue = [ pageDir ];
const throttle = 500; // 最多处理文件数量
let count = 0;

// 深度优先搜索
while (queue.length != 0) {
    if (count > throttle) {
        throw new Error(`handle over ${throttle} file`);
    }
    const filePath = queue.shift();
    const stats = fs.statSync(filePath);
    const isDirectory = stats.isDirectory();
    if (isDirectory) {
        // 如果是文件夹，加入queue
        const children = fs.readdirSync(filePath);
        queue.unshift(...children.map(child => filePath + '/' + child));
    } else {
        // 如果是文件，判断是否以vue结尾
        if (filePath.indexOf('.vue') >= 0) {
            const output = dir + '/ts' + filePath.substr(dir.length);
            fs.mkdirSync(path.dirname(output), {
                recursive: true,
                mode: 0o755,
            });
            handleVue(filePath, output);
            count++;
        }
    }
}
