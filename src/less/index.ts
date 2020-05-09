import fs from 'fs';
import postcss from 'postcss';
import less from 'postcss-less';
import { getSection } from '@/utils';

/**
 * 移除unit函数
 * @param {string} str
 */
function stripUnit(str: string) {
    return /unit\(.*\)/.test(str) ? str.replace(/unit\(([^()]*?)\)/g, '$1') : str;
}

/** 添加px */
function addUnit(str: string) {
    const n = Number(str);
    return isNaN(n) ? str : str + 'px';
}

/**
 * 将px2rem系列代码移除
 */
const plugin = postcss.plugin('postcss-test-plugin', (opts) => {
    opts = opts || {};
    return (root, result) => {
        // console.log('target1', root);
        root.walkRules((rule) => {
            // decl.value = '40px';
            // console.log(rule);
            // rule.walkAtRules((atRule) => {
            //     console.log(atRule);
            // });

            for (var i = 0, len = (rule.nodes || []).length; i < len; i++) {
                var node = rule.nodes![i];
                if (node.type == 'atrule' && node.name == 'px2rem6') {
                    const params = node.params.substring(1, node.params.length - 1).split(/\s*,\s*/);
                    const prop = params[0];
                    const value = params.slice(1).map(value => addUnit(stripUnit(value))).join(' ');
                    const decl = postcss.decl({ prop, value });
                    decl.important = node.important;
                    decl.raws.before = node.raws.before;
                    rule.nodes![i] = decl;
                }
            }
        });
    };
});

const enhancedPostcss = postcss([plugin]);

export async function handleCode(code: string) {
    return enhancedPostcss.process(code, { syntax: less });
}

/**
 * 处理less文件
 */
export async function handleLessFile(src: string, dist: string) {
    dist = dist || src;
    const code = fs.readFileSync(src, 'utf-8');
    const newCode = handleCode(code);
    fs.writeFileSync(dist, newCode);
}

/**
 * 处理vue文件
 */
export async function handleVueFile(src: string, dist: string) {
    dist = dist || src;
    const code = fs.readFileSync(src, 'utf-8');
    const result = getSection(code);
    if (result.style) {
        const newLessCode = handleCode(result.style.content);
        const newCode = code.substr(0, result.style.startPos) + newLessCode + code.substr(result.style.endPos);
        fs.writeFileSync(dist, newCode);
    } else {
        fs.writeFileSync(dist, code);
    }
}