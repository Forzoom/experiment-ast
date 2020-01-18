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
} from '@/lib/mta.js';

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
} from '@/lib/constant.js';

import {
    registerShare,
} from '@/lib/utils';

import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({
  name: "Mine",

  components: {
      NewTab,
      Item,
  }
})
export default class Mine extends Vue {
  @Prop({
      type: String,
  })
  public test;

  public a = 'a';

  public get userBasicInfo() {
    return store.state.util.userBasicInfo;
  }

  public get userAccount() {
    return store.state.user.userAccount;
  }

  public get hasUnreadGiftOrder() {
    return store.state.gift.hasUnreadGiftOrder;
  }

  public get test() {
      return '1';
  }

  @Watch("$props.value")
  public onPropsValueChange() {
      console.log('test');
  }

  public myEquipment() {
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

  public mySupport() {
      clickStat(ID_MINE, { supported: true, });
      this.$router.push({
          name: 'supported',
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
            .px2rem6(padding, 0, 14);
            .px2rem6(height, 117);
            background: url(../../assets/user-bg.png) center no-repeat;
            background-size: cover;
        }
        .user {
            position: relative;
            .px2rem6(top, 40);
            .px2rem6(padding, 15, 0, 15, 30);
            .px2rem6( border-top-left-radius, 4);
            .px2rem6( border-top-right-radius, 4);
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            .avatar {
                .px2rem6(width, 48);
                .px2rem6(height, 48);
                border-radius:50%;
                background-color: @color-avatar-bg;
            }
            .name {
                .px2rem6(width, 120);
                .px2rem6(max-height, 44);
                .px2rem6(margin-left, -50);
                .px2rem6(padding, 0, 5);
                font-weight: bold;
                overflow: hidden;
            }
            .id {
                box-sizing: border-box;
                .px2rem6(width, 80);
                .px2rem6(height, 25);
                .px2rem6(padding-left, 10);
                .px2rem6(line-height, 25);
                .px2rem6( border-radius, 25, 0, 0, 25);
                background-color: rgba(204, 28, 36, 1);
                color: white;
            }
        }
        .mine-account {
            box-sizing: border-box;
            .px2rem6(padding, 0, 14, 0);
            .px2rem6(height, 190);
            &>div:first-child {
                .px2rem6(height, 80);
            }
        }
        .account {
            box-sizing: border-box;
            .px2rem6(height, 90);
            .px2rem6(margin-bottom, 10);
            background: white;
            .px2rem6( border-radius, 4);
            display: flex;
            justify-content: space-around;
            align-items: center;
            text-align: center;
            .num {
                .px2rem6(line-height, 28);
                .px2rem6(font-size, 20);
                color:#333333;
                font-weight: bold;
            }
            .title {
                .px2rem6(margin-top, 10);
                .px2rem6(line-height, 20);
                .px2rem6(font-size, 14);
                color: #333333;
            }
            .icon {
                 color:#333333;
                .px2rem6(font-size, 24);
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
                .px2rem6(padding, 0, 14);
                .px2rem6(margin-bottom, 10);
                .list-item-wrap {
                    .fl {
                        .icon {
                            .px2rem6(font-size, 19);
                        }
                    }
                }
            }
        }
    }
</style>