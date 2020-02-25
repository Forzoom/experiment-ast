import { namedTypes, builders as b } from 'ast-types';
import { VueNode } from '../node';

export default function (node: VueNode) {
    let hasStore = false;
    if (node.computed) {
        for (const computed of node.computed) {
            if (computed.store) {
                hasStore = true;
            }
        }
    }

    if (!hasStore) {
        return;
    }

    let hasImport = false;
    if (node.imports) {
        node.imports.forEach((importDeclaration) => {
            if (importDeclaration.specifiers) {
                for (const specifier of importDeclaration.specifiers) {
                    if (specifier.type == 'ImportDefaultSpecifier' && specifier.local?.name == 'store') {
                        hasImport = true;
                    }
                }
            }
        });
    }

    if (!hasImport) {
        const declaration = b.importDeclaration([b.importDefaultSpecifier(b.identifier('store'))], b.literal('@/store'));
        if (node.imports) {
            node.imports.push(declaration);
        }
    }
}
