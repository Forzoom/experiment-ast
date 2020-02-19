import * as recast from 'recast';
import fs from 'fs';
import path from 'path';
// 尝试自定义扩展ast-types的定义
import { builders as b, namedTypes } from 'ast-types';
import * as K from 'ast-types/gen/kinds';
import * as parser from '@babel/parser';
import {
    Extract,
    parseMemberExpression,
    formatMemberExpression,
    importFromVuePropertyDecorator,
    camelCaseWithDollar,
    any,
} from '@/utils';

/**
 * 对于vue文件进行处理
 */
export default function(input: string, output: string) {
    console.info(input, output);
    const extname = path.extname(input);
    if (extname !== '.vue') {
        console.warn(input + ' isnt a vue file');
        return;
    }
    const originalCode = fs.readFileSync(input, 'utf-8');
    const startPos = originalCode.indexOf('<script>');
    if (startPos < 0) {
        console.warn(input + ' script is lost');
        return;
    }
    const endPos = originalCode.indexOf('</script>');
    const header = originalCode.substr(0, startPos) + '<script lang="ts">';
    const footer = originalCode.substr(endPos);
    const jsScript = originalCode.substr(startPos + 8, endPos - startPos - 8);
    const originalAst = recast.parse(jsScript, {
        parser: {
            parse(source: string, options: any) {
                return parser.parse(source, Object.assign(options, {
                    plugins: [
                        'estree',
                        'decorators-legacy',
                    ],
                    tokens: true,
                }))
            },
        },
        tabWidth: 4,
    });
    const generatedAst = recast.parse('', {
        tabWidth: 4,
    });
}