const { builders: b } = require('ast-types');
const {
    tsPropertySignature,
} = require('./b');

exports.asOriginal = function(p) {
    return p.value;
}
exports.asPropertySignature = function(p) {
    return tsPropertySignature(p.value.key.name, 'any');
}
exports.withDeclaration = function(p) {
    return p.value.declaration;
}
exports.getValueWithAddId = function(p) {
    p.value.value.id = b.identifier(p.value.key.name);
    return p.value.value;
}
exports.asPropertiesInObject = function(p) {
    return p.value.value.properties;
}

/**
 * 使用闭包形式
 */
exports.extractPropertyFromObject = function(name, cb) {
    const list = [];
    return {
        list,
        factory(p) {
            if (p.value) { // Property
                const parentPath1 = p.parentPath;
                if (parentPath1) { // Array
                    const parentPath2 = parentPath1.parentPath;
                    if (parentPath2.value.type === 'ObjectExpression') { // ObjectExpression
                        const parentPath3 = parentPath2.parentPath;
                        if (parentPath3) {
                            const key = parentPath3.value.key;
                            if (key && key.name === name) { // 并且是我们所想要的
                                list.push(cb(p));
                            }
                        }
                    }
                }
            }
        },
    };
}

exports.extractExportDefault = function(name, cb) {
    if (!cb) {
        cb = name;
        name = null;
    }
    const result = {};
    return {
        result,
        factory(p) {
            if (!cb) {
                if (p.type === 'ExportDefaultDeclaration') {
                    result.value = cb(p);
                }
            } else {
                if (p.value) { // Property
                    const parentPath1 = p.parentPath;
                    if (parentPath1) { // Array
                        const parentPath2 = parentPath1.parentPath;
                        if (parentPath2) { // ExportDefaultDeclaration
                            const parentPath3 = parentPath2.parentPath;
                            if (parentPath3 && parentPath3.value.type === 'ExportDefaultDeclaration' && p.value.key.name === name) {
                                result.value = cb(p);
                            }
                        }
                    }
                }
            }
        },
    };
}
