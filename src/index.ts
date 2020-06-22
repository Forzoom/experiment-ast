import './polyfill/polyfill';
import handleJsStore from './parser/jsStore';
export * as JSVueParser from './parser/jsVue';
export * as TsClassVueParser from './parser/tsClassVue';

export * as JSVueGenerator from './gen/jsVue';
export * as TSClassVueGenerator from './gen/tsClassVue';

import handleJsRouter from './parser/jsRouter';
import {
    handleCode as handleLessCode,
    handleLessFile as handleLessFile,
    handleVueFile as handleVueFileLess,
} from './less/index';

export default {
    handleJsRouter,
    handleJsStore,
    handleLessCode,
    handleLessFile,
    handleVueFileLess,
};
