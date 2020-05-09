import './polyfill/polyfill';
import handleJsStore from './js/store';
import handleJsVue from './js/vue';
import handleTsClassVue from './ts_class/vue';
import handleJsRouter from './js/router';
import {
    handleCode as handleLessCode,
    handleLessFile as handleLessFile,
    handleVueFile as handleVueFileLess,
} from './less/index';

export default {
    handleJsRouter,
    handleJsStore,
    handleJsVue,
    handleTsClassVue,
    handleLessCode,
    handleLessFile,
    handleVueFileLess,
};
