export const routerLifecycleNames = [ 'beforeRouteEnter', 'beforeRouteUpdate', 'beforeRouteLeave' ];
export const lifecycleNames = [ 'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed' ].concat(routerLifecycleNames);
export const topLevelNames = [ 'render' ].concat(lifecycleNames);

interface Section {
    tag: string;
    content: string;
    startPos: number;
    endPos: number;
}

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

/**
 * 从Vue文件中解析三个部分，比较困难的是template部分，因为可能会存在多个template的情况，目前先只解析script和style吧
 * @param code 代码
 */
export function getSection(code: string) {
    const result: { script: Section | null, style: Section | null } = {
        script: null,
        style: null,
    };
    const scriptRegexp = /<script (lang="[a-z]+")?>/;
    const scriptMatch = code.match(scriptRegexp);
    if (scriptMatch) {
        const tag = scriptMatch[0];
        let startPos = code.indexOf(tag);
        const endPos = code.indexOf('</script>');
        result.script = {
            tag,
            content: code.substr(startPos + tag.length, endPos - startPos - tag.length),
            startPos: startPos + tag.length,
            endPos,
        };
    }
    const styleRegexp = /<style (lang="[a-z]+")?>/;
    const styleMatch = code.match(scriptRegexp);
    if (styleMatch) {
        const tag = styleMatch[0];
        let startPos = code.indexOf(tag);
        const endPos = code.indexOf('</style>');
        result.style = {
            tag,
            content: code.substr(startPos + tag.length, endPos - startPos - tag.length),
            startPos: startPos + tag.length,
            endPos,
        };
    }
    return result;
}
