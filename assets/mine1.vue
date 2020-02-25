<template>
    <div class="mine-boss">
        <!-- 上方个人信息 -->
        <div class="mine-user">
            <div class="user">
                <img class="avatar" :src="userBasicInfo.avatar" />
                <div class="name large-text"> {{userBasicInfo.nickname}} </div>
                <div class="id small-text">ID：{{userBasicInfo.serial_number}}</div>
            </div>
        </div>
        <!-- 代金券 -->
        <div class="mine-account">
            <div class="account">
                <div @click="mypoints">
                    <div class="num">{{(userAccount ? userAccount.fund : 0) | currency}}</div>
                    <div class="title">基金</div>
                </div>
                <div @click="myVoucher">
                    <div class="num">{{(userAccount ? userAccount.coupon : 0) | currency}}</div>
                    <div class="title">代金券</div>
                </div>
            </div>
            <!-- 订单 -->
            <div class="account">
                <div @click="myCrowdfounding">
                    <div>
                        <i class="icon">&#xe62e;</i>
                    </div>
                    <div class="title">众筹订单</div>
                </div>
                <div @click="myEquipment">
                    <div>
                        <i class="icon">&#xe678;</i>
                    </div>
                    <div class="title">装备订单</div>
                </div>
                <div @click="myGift">
                    <div class="gift">
                        <i class="icon">&#xe618;</i>
                        <sup v-if="hasUnreadGiftOrder">
                            <i class="icon mark">&#xe62b;</i>
                        </sup>
                    </div>
                    <div class="title">礼品订单</div>
                </div>
                <div @click="myOrder">
                    <div>
                        <i class="icon">&#xe750;</i>
                    </div>
                    <div class="title">其他订单</div>
                </div>
            </div>
        </div>

        <!-- 下方列表 -->
        <div class="content-wrap">
            <div class="content-section white-bg">
                <!-- 我的地址 -->
                <Item
                    @click.native="myAddress"
                    title="地址管理">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe615;</i>
                    </div>
                </Item>
                <!-- 我的支持 -->
                <Item
                    @click.native="mySupport"
                    title="我的支持">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe671;</i>
                    </div>
                </Item>
                <!-- 完赛记录 -->
                <Item
                    @click.native="matchRecord"
                    title="完赛记录">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe674;</i>
                    </div>
                </Item>
                <!-- 海报生成 -->
                <!-- <Item
                    @click.native=""
                    title="海报生成">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe676;</i>
                    </div>
                </Item> -->
            </div>

            <div class="content-section white-bg">
                <Item
                    @click.native="myDynamic"
                    title="我的动态">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe679;</i>
                    </div>
                </Item>
            </div>

            <div class="content-section white-bg">
                <!-- 问题咨询 -->
                <Item
                    @click.native="feedback"
                    title="问题咨询">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe673;</i>
                    </div>
                </Item>
                <!-- 商务合作 -->
                <!-- <Item
                    @click.native=""
                    title="商务合作">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe672;</i>
                    </div>
                </Item> -->
                <!-- 手机绑定 -->
                <Item
                    title="手机绑定"
                    @click.native="phoneBinding">
                    <div class="icon-wrap fl">
                        <i class="icon">&#xe675;</i>
                    </div>
                </Item>
            </div>
        </div>
        <!-- 底部导航 -->
        <NewTab :selected="4"></NewTab>
    </div>
</template>

<script lang="ts">
import {
    ID_MINE,
} from '@/lib/mta';

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
} from '@/lib/constant';

import {
    registerShare,
} from '@/lib/utils';

import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';

// test
@Component({
    name: 'Mine',

    components: {
        NewTab,
        Item,
    },
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
    @Watch('$props.value')
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
</script>

<style lang="less">
    @import '../../lib/style/mixins.less';
    @import '../../lib/util.less';
    .mine-boss {
        position: relative;
        background-color: @default-bg-color;
        #fit-iphonex6(padding-bottom, 50);
        .mine-user {
            position: relative;
            box-sizing: border-box;
            padding: 0px 14px;
            height: 117px;
            background: url(../../assets/user-bg.png) center no-repeat;
            background-size: cover;
        }
        .user {
            position: relative;
            top: 40px;
            padding: 15px 0px 15px 30px;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            .avatar {
                width: 48px;
                height: 48px;
                border-radius:50%;
                background-color: @color-avatar-bg;
            }
            .name {
                width: 120px;
                max-height: 44px;
                margin-left: -50px;
                padding: 0px 5px;
                font-weight: bold;
                overflow: hidden;
            }
            .id {
                box-sizing: border-box;
                width: 80px;
                height: 25px;
                padding-left: 10px;
                line-height: 25px;
                 border-radius: 25px 0px 0px 25px;
                background-color: rgba(204, 28, 36, 1);
                color: white;
            }
        }
        .mine-account {
            box-sizing: border-box;
            padding: 0px 14px 0px;
            height: 190px;
            &>div:first-child {
                height: 80px;
            }
        }
        .account {
            box-sizing: border-box;
            height: 90px;
            margin-bottom: 10px;
            background: white;
             border-radius: 4px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            text-align: center;
            .num {
                line-height: 28px;
                font-size: 20px;
                color:#333333;
                font-weight: bold;
            }
            .title {
                margin-top: 10px;
                line-height: 20px;
                font-size: 14px;
                color: #333333;
            }
            .icon {
                 color:#333333;
                font-size: 24px;
            }
            .gift {
                position: relative;
            }
            .mark {
                position: absolute;
                top: 3;
                color: #E11B24;
            }
        }
        .content-wrap  {
            .content-section {
                padding: 0px 14px;
                margin-bottom: 10px;
                .list-item-wrap {
                    .fl {
                        .icon {
                            font-size: 19px;
                        }
                    }
                }
            }
        }
    }
</style>