import fs from 'fs';

export function getScriptContent(code: string) {
    const startPosJs = code.indexOf('<script>');
    const startPosTs = code.indexOf('<script lang="ts">');
    if (startPosJs < 0 && startPosTs < 0) {
        return null;
    }
    const startPos = startPosJs < 0 ? startPosTs : startPosJs;
    const endPos = code.indexOf('</script>');
    const header = code.substr(0, startPos) + '<script lang="ts">';
    const footer = code.substr(endPos);
    const jsScript = code.substr(startPos + 8, endPos - startPos - 8);

    return { header, footer, jsScript };
}