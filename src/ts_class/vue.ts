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
    getScriptContent,
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
    const scriptContent = getScriptContent(originalCode);
    if (!scriptContent) {
        console.warn(input + ' script is lost');
        return;
    }
    const originalAst = recast.parse(scriptContent.jsScript, {
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

    // 寻找class的导出
    const body = originalAst.program.body as namedTypes.Node[];
    let classDeclaration: namedTypes.ClassDeclaration | null = null;
    for (const node of body) {
        if (node.type === 'ClassDeclaration') {
            classDeclaration = node as namedTypes.ClassDeclaration;
        }
    }

    if (!classDeclaration) {
        console.warn('cannot find class declaration');
        return;
    }

    // 寻找所有的变量定义
    for (const item of classDeclaration.body.body) {

    }
}