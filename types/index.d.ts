import * as K from "ast-types/gen/kinds";
import { VueNode } from '@/gen/node';

type ExportDefaultKey = 'name' | 'components' | 'data' | 'props' | 'computed' | 'watch' | 'methods' | 'filters' | 'directives' | 'mixins';

interface Parser {

}

interface Generator {
    plugins: any;
    handle(vueNode: VueNode, output: string): void;
}

// 对于类型进行一定的扩展，以支持更加的丰富的decorators之类的属性
declare module 'ast-types/gen/namedTypes' {
    namespace namedTypes {
        interface ClassDeclaration {
            decorators?: K.DecoratorKind[] | null;
        }
        interface ClassProperty {
            decorators?: K.DecoratorKind[] | null;
        }
        interface MethodDefinition {
            accessibility: 'public' | 'private' | 'protected' | undefined;
        }
        type PrimitiveLiteral = StringLiteral | NumericLiteral | BooleanLiteral | NullLiteral;
    }
}

declare module 'postcss' {
    interface AtRule extends ContainerBase {
        important: boolean;
    }
}
