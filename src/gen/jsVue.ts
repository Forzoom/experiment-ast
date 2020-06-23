import * as recast from 'recast';
import { VueNode, DataNode, ComputedNode, PropNode, WatchNode, MethodNode, LifecycleNode } from '@/node';
import fs from 'fs';
import {
    namedTypes,
    builders as b,
} from 'ast-types';
import { Generator, GeneratorPlugin } from 'types/index';
import { extWith } from '@/utils';

export default class JSClassVueGenerator implements Generator {
    public plugins: GeneratorPlugin[] = [];

    public constructor(plugins?: GeneratorPlugin[]) {
        this.plugins = plugins || [];
    }

    public handle(vueNode: VueNode, output: string) {
        const generatedAst = recast.parse('', {
            tabWidth: 4,
        });
        generatedAst.program.body.push(...vueNode.imports, ...vueNode.other);
        generatedAst.program.body.push(vueNode.toJs());
        let code: string = '';
        if (extWith('.vue', vueNode.filePath) || (vueNode.template?.length && vueNode.style?.length)) {
            code = scriptContent.header + '\n<script>\n' + recast.print(generatedAst, { tabWidth: 4 }).code + '\n</script>\n' + scriptContent.footer;
        } else {
            code = recast.print(generatedAst, { tabWidth: 4 }).code;
        }
        
        fs.writeFileSync(output, code);
    }

    public data(node: DataNode) {
        const property = b.property('init', b.identifier(node.key), node.init);
        property.comments = node.comments;
        return property;
    }
    
    public computed(node: ComputedNode) {
        const property = b.property('init', b.identifier(node.key), node.value);
        property.comments = node.comments;
        return property;
    }
    
    public prop(node: PropNode) {
        let value = node.value;
        if (!value) {
            value = b.objectExpression([]);
        }
        const property = b.property('init', b.identifier(node.key), value);
        property.comments = node.comments;
        return property;
    }
    
    public watch(node: WatchNode) {
        let key: namedTypes.Identifier | namedTypes.StringLiteral | null = null;
        if (node.key[0] === '$') {
            key = b.stringLiteral(node.key);
        } else {
            key = b.identifier(node.key);
        }
        // tip: 这里直接使用原本的functionExpression存在问题，将无法生成正确的function关键字
        // 也可以通过赋予一个函数名字来解决这个问题
        const functionExpression = b.functionExpression(null, node.value.params, node.value.body);
        const property = b.property('init', key, functionExpression);
        property.comments = node.comments;
        return property;
    }
    
    public method(node: MethodNode) {
        const property = b.property('init', b.identifier(node.key), node.value);
        property.comments = node.comments;
        return property;
    }
    
    public lifecycle(node: LifecycleNode) {
        // todo
    }
}