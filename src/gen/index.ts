import { VueNode } from '@/node';
import { GeneratorPlugin } from 'types';

/**
 * 生成器
 */
export abstract class Generator {
    plugins: GeneratorPlugin[] = [];

    public constructor(plugins?: GeneratorPlugin[]) {
        this.plugins = plugins || [];
    }

    handle(vueNode: VueNode, output: string) {};

    public addPlugin(plugin: GeneratorPlugin) {
        this.plugins.push(plugin);
    }
}
