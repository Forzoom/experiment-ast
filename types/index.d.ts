import * as K from "ast-types/gen/kinds";

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