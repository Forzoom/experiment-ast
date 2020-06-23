import { Block, BlockType, Attrs } from 'types/index';

export const routerLifecycleNames = [ 'beforeRouteEnter', 'beforeRouteUpdate', 'beforeRouteLeave' ];
export const lifecycleNames = [ 'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed' ].concat(routerLifecycleNames);
export const topLevelNames = [ 'render' ].concat(lifecycleNames);

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

function parseAttr(str: string) {
    const parts = str.replaceAll(/[ ]+/, ' ').split(' ');
    const attr: { [key: string]: string } = {};
    for (const part of parts) {
        const match = part.match(/([a-z]+)="([a-z]+)"/);
        if (match) {
            const [ _, key, value ] = match;
            attr[key] = value;
        }
    }
    return attr;
}

function formatAttr(attrs?: Attrs | null) {
    if (!attrs) {
        return '';
    }
    const keys = Object.keys(attrs);
    return keys.map(key => `${key}="${attrs[key]}"`).join(' ');
}

/**
 * 从Vue文件中解析三个部分，比较困难的是template部分，因为可能会存在多个template的情况，目前先只解析script和style吧
 * @param code 代码
 */
export function parseBlock(code: string) {
    const result: Block[] = [];
    const regexp = /<(script|template|style) ([a-z'"= ]*)?>/;

    const match = code.match(regexp);
    if (match) {
        const [ startTag, type, attrStr ] = match;
        const endTag = `</${type}>`;
        const startPos = code.indexOf(startTag);
        const endPos = code.indexOf(endTag);
        result.push({
            type: type as BlockType,
            content: code.substring(startPos + startTag.length, endPos - endTag.length),
            attr: attrStr ? parseAttr(attrStr) : null,
        });
    }

    return result;
}

/**
 * 根据代码block生成代码
 * @param blocks 所有的代码block
 */
export function formatBlock(blocks: Block[]) {
    return blocks.map(block => `<${block.type} ${formatAttr(block.attr)}>\n${block.content}\n</${block.type}>\n`).join('');
}
