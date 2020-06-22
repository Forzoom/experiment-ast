import * as recast from 'recast';
import { VueNode } from './node';
import { builders as b, namedTypes } from 'ast-types';
import { Generator } from '../../types/index';
import {
    writeFileSync,
    camelCaseWithFirstLetter,
    importFromVuePropertyDecorator,
} from '@/utils';

class TSClassVueGenerator implements Generator {
    public plugins: any;

    public async handle(vueNode: VueNode, output: string) {
        // 定义class
        const clazz = b.classDeclaration(
            b.identifier(camelCaseWithFirstLetter(vueNode.name)),
            b.classBody([
                ...(vueNode.props || []).map(node => node.toTsClass()),
                ...(vueNode.data || []).map(node => node.toTsClass()),
                ...(vueNode.computed || []).map(node => node.toTsClass()),
                ...(vueNode.watch || []).map(node => node.toTsClass()),
                ...(vueNode.methods || []).map(node => node.toTsClass()),
                ...(vueNode.lifecycles || []).map(node => node.toTsClass()),
            ]),
            b.identifier('Vue')
        );
        clazz.decorators = [
            b.decorator(
                b.callExpression(
                    b.identifier('Component'),
                    [
                        b.objectExpression([
                            b.property('init', b.identifier('name'), b.literal(vueNode.name)),
                            vueNode.components!,
                            vueNode.filters!,
                            vueNode.directives!,
                            vueNode.mixins!,
                        ].filter(_ => _)),
                    ],
                )
            )
        ];
        const exportDefault = b.exportDefaultDeclaration(clazz);
        exportDefault.comments = vueNode.comments;

        const importMap: {
            [source: string]: namedTypes.ImportDeclaration,
        } = {};
        if (vueNode.imports) {
            let index = -1;
            for (let i = 0, len = vueNode.imports.length; i < len; i++) {
                const importDeclaration = vueNode.imports[i];
                const source = importDeclaration.source;
                if (source.type === 'Literal' && typeof source.value == 'string') {
                    importMap[source.value] = importDeclaration;
                    if (source.value == 'vue') {
                        index = i;
                    }
                }
            }
            if (index >= 0) {
                vueNode.imports.splice(index, 1);
            }
        }

        // 处理vue-property-decorator
        const importFromVPD = importFromVuePropertyDecorator([
            vueNode.props && vueNode.props.length > 0 ? 'Prop' : null,
            vueNode.watch && vueNode.watch.length > 0 ? 'Watch' : null,
        ]);

        if (vueNode.imports) {
            vueNode.imports.push(importFromVPD);
        } else {
            vueNode.imports = [
                importFromVPD,
            ];
        }

        const generatedAst = recast.parse('', {
            tabWidth: 4,
        });
        generatedAst.program.body.push(...vueNode.imports, ...other);
        generatedAst.program.body.push(exportDefault);
        const generatedCode = recast.print(generatedAst, {
            tabWidth: 4,
            quote: 'single',
            trailingComma: true,
        }).code;
    
        // 处理less
        const startPos = scriptContent.footer.indexOf('<style lang="less">');
        if (startPos >= 0) {
            const endPos = scriptContent.footer.indexOf('</style>');
            const lessCode = scriptContent.footer.substring(startPos + 19, endPos);
            const lessResult = await handleLess(lessCode);
            scriptContent.footer = scriptContent.footer.substr(0, startPos + 19) + lessResult.css + scriptContent.footer.substr(endPos);
        }
    
        const code = scriptContent.header + '\n<script lang="ts">\n' + generatedCode + '\n</script>\n' + scriptContent.footer;
        
        writeFileSync(output, code);
    }
}