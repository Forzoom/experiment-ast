import postcss from 'postcss';
import less from 'postcss-less';

function stripUnit(str: string) {
    return /unit\(.*\)/.test(str) ? str.replace(/unit\(([^()]*?)\)/g, '$1') : str;
}

function addUnit(str: string) {
    const n = Number(str);
    return isNaN(n) ? str : str + 'px';
}

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
                    // console.log(node, params, node.params);
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

export default async function(code: string) {
    return enhancedPostcss.process(code, { syntax: less });
}
