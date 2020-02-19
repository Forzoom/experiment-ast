import fs from 'fs';

export function getScriptContent(code: string) {
    const startPos = code.indexOf('<script>');
    if (startPos < 0) {
        return null;
    }
    const endPos = code.indexOf('</script>');
    const header = code.substr(0, startPos) + '<script lang="ts">';
    const footer = code.substr(endPos);
    const jsScript = code.substr(startPos + 8, endPos - startPos - 8);

    return { header, footer, jsScript };
}