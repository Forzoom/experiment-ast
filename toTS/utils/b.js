const { builders: b } = require('ast-types');

exports.tsPropertySignature = function(id, reference) {
    return b.tsPropertySignature(b.identifier(id), b.tsTypeAnnotation(b.tsTypeReference(b.identifier(reference))));
}
