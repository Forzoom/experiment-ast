import './toTS/polyfill';
import * as recast from 'recast';
import tsParser from '@typescript-eslint/typescript-estree';
import handleStore from './toTS/store';
import handleVue from './toTS/vue';
import fs from 'fs';
import path from 'path';

// console.log(fs.readFileSync);

// handleStore('./assets/address1.js', './assets/address1.ts');
// handleVue('./assets/mine.vue', './assets/mine1.vue');

const dir = '/Volumes/Repo2/repo/vue/tourye_web_ts/src';
const dist = '/Volumes/Repo2/repo/vue/tourye_web_ts_ast/src';
const componentDir = dir + '/components';
const featureDir = dir + '/features';
const pageDir = dir + '/pages';
const storeDir = dir + '/store';
const queue = [ pageDir ];
const throttle = 1; // 最多处理文件数量
let count = 0;

// 深度优先搜索
while (queue.length > 0) {
    if (count >= throttle) {
        throw new Error(`handle over ${throttle} file`);
    }
    const filePath = queue.shift();
    if (filePath) {
        const stats = fs.statSync(filePath);
        const isDirectory = stats.isDirectory();
        if (isDirectory) {
            // 如果是文件夹，加入queue
            const children = fs.readdirSync(filePath);
            queue.unshift(...children.map(child => filePath + '/' + child));
        } else {
            // 如果是文件，判断是否以vue结尾
            if (filePath.indexOf('.vue') >= 0) {
                const output = dist + filePath.substr(dir.length);
                fs.mkdirSync(path.dirname(output), {
                    recursive: true,
                    mode: 0o755,
                });
                handleVue(filePath, output);
                count++;
            }
        }
    }
}
