import Vue from 'vue';
import {
    isUndef,
} from '@/lib/utils';

const m: A = {}

/**
 * 默认的id为-1，表明当前没有处理该数据，没有数据为0，表明在该上级行政区下，没有对应的下级行政区
 *
 * 默认从服务器返回的数据结构为 {id, name}
 */
export default {
    namespaced: true,
    state: {
        // 所有的province列表原始数据
        _provinceList: [],
        // 所有的 id -> 子类的list
        _listMap: {},
        // 所有的district内容的map，即id -> district<{id, level, name}>
        _districtMap: {},
    },
    mutations: {
        /**
         * 准备存储data
         *
         * @param {Number} id 父地区id
         * @param {Array} list 某次请求获得的list内容
         */
        addList(state, { id, list, }) {
            Vue.set(state._listMap, id, list);
            // 保存到map中
            list.forEach(district => {
                Vue.set(state._districtMap, district.id, district);
            });
        },
        /**
         * 设置provinceList
         *
         * @param {Array} provinceList 所有的province列表 [{id: 1, name: '北京市'}]
         */
        setProvinceList(state, provinceList) {
            state._provinceList = provinceList;
        },
    },
    actions: {
        /**
         * 获取省列表
         *
         * @param {} forceUpdate 强制更新
         *
         * @return {Array} ProvinceList
         */
        async getProvinceList({ state, commit, }, { forceUpdate, } = {}) {
            if (state._provinceList.length === 0) {
                commit('startRequest');
                const response = await Vue.axios.get('/wechat/v2/framework/top_level_districts');
                commit('endRequest');
                const rdata = response.data;
                if (rdata.status === 0) {
                    const data = rdata.data;
                    commit('setProvinceList', data);
                    commit('addList', {
                        id: 0, // 对于provinceList来说，id是默认为0的
                        list: data,
                    });
                }
            }
            return state._provinceList;
        },

        /**
         * 获取列表
         *
         * @param {} forceUpdate 强制更新
         * @param {} id 父级地区id
         *
         * @return {} 子行政区的内容
         */
        async getChildDistricts({ state, commit, }, { forceUpdate, id, } = {}) {
            if (isUndef(state._listMap[id]) || forceUpdate) {
                commit('startRequest');
                const response = await Vue.axios.get('/wechat/v2/framework/child_districts', {
                    params: {
                        id,
                    },
                });
                commit('endRequest');
                const rdata = response.data;
                if (rdata.status === 0) {
                    commit('addList', {
                        id,
                        list: rdata.data,
                    });
                }
            }
            return state._listMap[id];
        },
    },
};