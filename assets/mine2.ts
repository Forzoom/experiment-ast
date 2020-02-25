import {
    ID_MINE,
} from "@/lib/mta";

import {
    clickStat,
} from '@forzoom/mta';
import store from '@/stores/index';
import {
    mapState,
} from 'vuex';
import NewTab from '@/features/indexNew/newTab.vue';
import Item from '@/features/mine/listItem.vue';

import {
    LOGO,
    SHOP_ORDER_URL,
    ROUTE_NAME,
} from "@/lib/constant";

import {
    registerShare,
} from '@/lib/utils';

import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Route } from "vue-router";

export default {
    name: "Mine",

    components: {
        NewTab,
        Item,
    },

    props: {
        // test
        test1: {
            type: String,
        }
    },

    data: function data() {
        return {
            // test
            a: 'a'
        };
    },

    computed: {
        /** 个人基础信息 */
        userBasicInfo: function() {
            return store.state.util.userBasicInfo;
        },

        /** 个人账户 */
        userAccount: function() {
            return store.state.user.userAccount;
        },

        /** 是否有未读礼品 */
        hasUnreadGiftOrder: function() {
            return store.state.gift.hasUnreadGiftOrder;
        },

        // test
        test: function() {
            return '1';
        }
    },

    methods: {
        // test
        myEquipment: function(a) {
            window.location.href = SHOP_ORDER_URL;
        },

        myGift: function() {
            this.$router.push({
                name: ROUTE_NAME.GIFT_ORDER,
            });
        },

        myAddress: function() {
            this.$router.push({
                name: ROUTE_NAME.GIFT_ADDRESS,
            });
        },

        myCrowdfounding: function() {
            clickStat(ID_MINE, { crowd: true, });
            this.$router.push({ name: ROUTE_NAME.CROWD_LIST, });
        },

        myOrder: function() {
            clickStat(ID_MINE, { order: true, });
            this.$router.push({
                name: ROUTE_NAME.ORDER_LIST,
            });
        },

        mypoints: function() {
            clickStat(ID_MINE, { fund: true, });
            this.$router.push({
                name: 'user_account',
            });
        },

        /**
         * 点击代金券
         */
        myVoucher: function() {
            clickStat(ID_MINE, { coupon: true, });
            this.$router.push({ name: ROUTE_NAME.VOUCHER, });
        },

        myDynamic: function() {
            clickStat(ID_MINE, { dynamic: true, });
            this.$router.push({ name: 'dynamic', });
        },

        matchRecord: function() {
            clickStat(ID_MINE, { record: true, });
            this.$router.push({
                name: 'matchRecord',
            });
        },

        feedback: function() {
            clickStat(ID_MINE, { problem: true, });
            this.$router.push({
                name: ROUTE_NAME.FEEDBACK,
            });
        },

        phoneBinding: function() {
            clickStat(ID_MINE, { tel: true, });
            if (!this.userBasicInfo.mobile_bound) {
                this.$router.push({
                    name: ROUTE_NAME.PHONE_BINDING,
                });
            } else {
                this.$router.push({
                    name: ROUTE_NAME.PHONE_REBINDING,
                });
            }
        },

        /**
         * 点击“我的支持”
         */
        mySupport: function() {
            clickStat(ID_MINE, { supported: true, });
            this.$router.push({
                name: 'supported',
            });
        }
    },

    // test
    beforeRouteEnter: async function(to, from, next) {
        store.commit('startRequest');
        await Promise.all([
            store.dispatch('getUserAccountInfo', {
                forceUpdate: true,
            }),
            store.dispatch('gift/getHasUnreadGiftOrder'),
        ]);
        store.commit('endRequest');
        next();
    },

    // test
    created: function() {
        store.commit('addJSSDKReadyCallback', () => {
            registerShare({
                title: '个人中心', // 分享标题
                desc: '一生必走的9大路线', // 分享描述
                link: {
                    query: {
                        referrer: this.userBasicInfo.id,
                    },
                    path: {
                        name: ROUTE_NAME.USER_HOME,
                    },
                },
                imgUrl: LOGO, // 分享图标
            });
        });
    }
};