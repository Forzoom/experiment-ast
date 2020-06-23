import {
    namedTypes,
    builders as b,
} from 'ast-types';
import * as K from 'ast-types/gen/kinds';
import {
    any,
    parseMemberExpression,
    formatMemberExpression,
    camelCaseWithDollar,
    camelCaseWithFirstLetter,
    importFromVuePropertyDecorator,
} from '@/utils';
import { Block } from 'types';

export class VueNode {
    /** 文件路径 */
    filePath?: string;

    originalAst: any;
    name: string;
    components?: namedTypes.Property | null;
    filters?: namedTypes.Property | null;
    directives?: namedTypes.Property | null;
    mixins?: namedTypes.Property | null;
    imports?: namedTypes.ImportDeclaration[] | null;
    props?: PropNode[] | null;
    data?: DataNode[] | null;
    computed?: ComputedNode[] | null;
    watch?: WatchNode[] | null;
    methods?: MethodNode[] | null;
    lifecycles?: LifecycleNode[] | null;
    comments?: K.CommentKind[] | null;

    /** template block */
    template?: Block[];
    /** style block */
    style?: Block[];
    /** 除了export和import之外的其他内容 */
    other: namedTypes.Node[] = [];

    /** 组件名字 */
    constructor(name: string) {
        this.name = name;
    }

    public toJs() {
        const dataFn = b.functionExpression(
            b.identifier('data'),
            [],
            b.blockStatement([
                b.returnStatement(
                    b.objectExpression((this.data || []).map(node => node.toJs()))
                ),
            ])
        );
        const properties: namedTypes.Property[] = [];
        properties.push(b.property('init', b.identifier('name'), b.stringLiteral(this.name)));
        if (this.components) {
            properties.push(this.components);
        }
        if (this.filters) {
            properties.push(this.filters);
        }
        if (this.directives) {
            properties.push(this.directives);
        }
        if (this.mixins) {
            properties.push(this.mixins);
        }
        properties.push(b.property('init', b.identifier('props'), b.objectExpression((this.props || []).map(node => node.toJs()))));
        properties.push(b.property('init', b.identifier('data'), dataFn));
        properties.push(b.property('init', b.identifier('computed'), b.objectExpression((this.computed || []).map(node => node.toJs()))));
        properties.push(b.property('init', b.identifier('watch'), b.objectExpression((this.watch || []).map(node => node.toJs()))));
        properties.push(b.property('init', b.identifier('methods'), b.objectExpression((this.methods || []).map(node => node.toJs()))));
        properties.push(...(this.lifecycles || []).map(node => {
            const property = b.property('init', b.identifier(node.key), node.value);
            property.comments = node.comments;
            return property;
        }));
        const obj = b.objectExpression(properties);
        const exportDefault = b.exportDefaultDeclaration(obj);
        exportDefault.comments = this.comments;
        return exportDefault;
    }
}

export class DataNode {
    key: string;
    /** 可能是Literal */
    init: any;
    comments?: K.CommentKind[] | null;

    constructor(key: string, init: any) {
        this.key = key;
        this.init = init;
    }

    public toJs() {
        const property = b.property('init', b.identifier(this.key), this.init);
        property.comments = this.comments;
        return property;
    }
}

export class ComputedNode {
    key: string;
    value: namedTypes.FunctionExpression | namedTypes.ArrowFunctionExpression;
    comments?: K.CommentKind[] | null;

    /** 是否来自store */
    store: boolean = false;
    storeNamespace?: string | null;

    constructor(key: string, value: namedTypes.FunctionExpression | namedTypes.ArrowFunctionExpression) {
        this.key = key;
        this.value = value;
    }

    public toJs() {
        const property = b.property('init', b.identifier(this.key), this.value);
        property.comments = this.comments;
        return property;
    }
}

export class PropNode {
    key: string;
    value: any;
    comments?: K.CommentKind[] | null;

    constructor(key: string, value: any) {
        this.key = key;
        this.value = value;
    }

    public toJs() {
        let value = this.value;
        if (!value) {
            value = b.objectExpression([]);
        }
        const property = b.property('init', b.identifier(this.key), value);
        property.comments = this.comments;
        return property;
    }
}

export class WatchNode {
    key: string;
    value: namedTypes.FunctionExpression;
    comments?: K.CommentKind[] | null;
    constructor(key: string, value: namedTypes.FunctionExpression) {
        this.key = key;
        this.value = value;
    }

    public toJs() {
        let key: namedTypes.Identifier | namedTypes.StringLiteral | null = null;
        if (this.key[0] === '$') {
            key = b.stringLiteral(this.key);
        } else {
            key = b.identifier(this.key);
        }
        // tip: 这里直接使用原本的functionExpression存在问题，将无法生成正确的function关键字
        // 也可以通过赋予一个函数名字来解决这个问题
        const functionExpression = b.functionExpression(null, this.value.params, this.value.body);
        const property = b.property('init', key, functionExpression);
        property.comments = this.comments;
        return property;
    }
}

export class MethodNode {
    key: string;
    value: namedTypes.FunctionExpression;
    comments?: K.CommentKind[] | null;
    constructor(key: string, value: namedTypes.FunctionExpression) {
        this.key = key;
        this.value = value;
    }

    public toJs() {
        const property = b.property('init', b.identifier(this.key), this.value);
        property.comments = this.comments;
        return property;
    }
}

export class LifecycleNode {
    key: string;
    value: namedTypes.FunctionExpression;
    comments?: K.CommentKind[] | null;

    constructor(key: string, value: namedTypes.FunctionExpression) {
        this.key = key;
        this.value = value;
    }
}
