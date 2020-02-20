import fs from 'fs';

export function getScriptContent(code: string) {
    let tag = '<script>';
    let startPos = code.indexOf(tag);
    if (startPos < 0) {
        tag = '<script lang="ts">';
        startPos = code.indexOf(tag);
    }
    if (startPos < 0) {
        return null;
    }
    const endPos = code.indexOf('</script>');
    const header = code.substr(0, startPos);
    const footer = code.substr(endPos + 9);
    const jsScript = code.substr(startPos + tag.length, endPos - startPos - tag.length);

    return { header, footer, jsScript };
}