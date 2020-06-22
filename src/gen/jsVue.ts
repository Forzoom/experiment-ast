import * as recast from 'recast';
import { VueNode } from '@/gen/node';
import fs from 'fs';
import { Generator } from '../../types/index';

export default class JSClassVueGenerator implements Generator {
    public plugins: any;

    public handle(vueNode: VueNode, output: string) {
        const generatedAst = recast.parse('', {
            tabWidth: 4,
        });
        generatedAst.program.body.push(...vueNode.imports, ...other);
        generatedAst.program.body.push(vueNode.toJs());
        let code: string = '';
        if (extname === '.vue') {
            code = scriptContent.header + '\n<script>\n' + recast.print(generatedAst, { tabWidth: 4 }).code + '\n</script>\n' + scriptContent.footer;
        } else {
            code = recast.print(generatedAst, { tabWidth: 4 }).code;
        }
        
        fs.writeFileSync(output, code);
    }
}