import './polyfill/polyfill';
import handleJsStore from './js/store';
import handleJsVue from './js/vue';
import handleTsClassVue from './ts_class/vue';
import handleJsRouter from './js/router';

export default {
    handleJsRouter,
    handleJsStore,
    handleJsVue,
    handleTsClassVue,
};
