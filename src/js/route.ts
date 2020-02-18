import * as recast from 'recast';
import * as parser from '@babel/parser';
import path from 'path';
import fs from 'fs';

export default function(input: string, output: string) {
    console.info(input, output);
    const extname = path.extname(input);
    if (extname !== '.js') {
        console.warn(input + ' isnt a js file');
        return;
    }
    const fileName = path.basename(input, extname);
    const originalCode = fs.readFileSync(input, 'utf-8');
    const originalAst = recast.parse(originalCode, {
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
    });

    // 解析得到 组件定义 + 默认导出对象
    // 修改默认导出对象，需要和组件定义一一对应
    // 修改
}