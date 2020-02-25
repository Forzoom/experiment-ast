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

// test
@Component({
    name: "Mine",

    components: {
        NewTab,
        Item,
    }
})
export default class Mine extends Vue {
    // test
    @Prop({
        type: String,
    })
    public test1: any;

    // test
    public a: any = 'a';

    /** 个人基础信息 */
    public get userBasicInfo() {
        return store.state.util.userBasicInfo;
    }

    /** 个人账户 */
    public get userAccount() {
        return store.state.user.userAccount;
    }

    /** 是否有未读礼品 */
    public get hasUnreadGiftOrder() {
        return store.state.gift.hasUnreadGiftOrder;
    }

    // test
    public get test() {
        return '1';
    }

    // test
    @Watch("$props.value")
    public onPropsValueChange(b: any) {
        console.log('test');
    }

    // test
    public myEquipment(a: any) {
        window.location.href = SHOP_ORDER_URL;
    }

    public myGift() {
        this.$router.push({
            name: ROUTE_NAME.GIFT_ORDER,
        });
    }

    public myAddress() {
        this.$router.push({
            name: ROUTE_NAME.GIFT_ADDRESS,
        });
    }

    public myCrowdfounding() {
        clickStat(ID_MINE, { crowd: true, });
        this.$router.push({ name: ROUTE_NAME.CROWD_LIST, });
    }

    public myOrder() {
        clickStat(ID_MINE, { order: true, });
        this.$router.push({
            name: ROUTE_NAME.ORDER_LIST,
        });
    }

    public mypoints() {
        clickStat(ID_MINE, { fund: true, });
        this.$router.push({
            name: 'user_account',
        });
    }

    /**
     * 点击代金券
     */
    public myVoucher() {
        clickStat(ID_MINE, { coupon: true, });
        this.$router.push({ name: ROUTE_NAME.VOUCHER, });
    }

    public myDynamic() {
        clickStat(ID_MINE, { dynamic: true, });
        this.$router.push({ name: 'dynamic', });
    }

    public matchRecord() {
        clickStat(ID_MINE, { record: true, });
        this.$router.push({
            name: 'matchRecord',
        });
    }

    public feedback() {
        clickStat(ID_MINE, { problem: true, });
        this.$router.push({
            name: ROUTE_NAME.FEEDBACK,
        });
    }

    public phoneBinding() {
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
    }

    /**
     * 点击“我的支持”
     */
    public mySupport() {
        clickStat(ID_MINE, { supported: true, });
        this.$router.push({
            name: 'supported',
        });
    }

    // test
    public async beforeRouteEnter(to: Route, from: Route, next: any) {
        store.commit('startRequest');
        await Promise.all([
            store.dispatch('getUserAccountInfo', {
                forceUpdate: true,
            }),
            store.dispatch('gift/getHasUnreadGiftOrder'),
        ]);
        store.commit('endRequest');
        next();
    }

    // test
    public created() {
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
}