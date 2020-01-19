export function camelCaseWithFirstLetter(str: string) {
    return str.substr(0, 1).toUpperCase() + str.substr(1).replace(/[-_][a-z0-9]/g, (c) => c.substr(1).toUpperCase());
}
/**
 * 用于处理 $props.value 这样的属性内容
 */
export function camelCaseWithDollar(str: string) {
    if (str[0] === '$') {
        str = str.substr(1);
    }
    return str.split('.').map(part => camelCaseWithFirstLetter(part)).join('');
}