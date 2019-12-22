<template>
    <div class="page-user-home" :class="{'safe-area': useSafeArea}">
        <div class="white-bg">
            <section class="user-info">
                <div class="info">
                    <PreviewImageList class="avatar" :src="[userBasicInfo.avatar]" />
                    <div>
                        <div class="nickname large-text">{{userBasicInfo.nickname}}</div>
                        <div class="id">
                            ID：{{userBasicInfo.serial_number}}
                            <MobileButton :data-clipboard-text="userBasicInfo.serial_number" class="btn-copy">
                                复制
                            </MobileButton>
                        </div>
                    </div>
                    <i @click="onClickInfo" class="icon right">&#xe63c;</i>
                </div>
                <div class="data">
                    <div>
                        <SkText :skeleton-show="userStats.total_distance == null"
                            class="number">
                            {{Math.floor(userStats.total_distance)}}
                        </SkText>
                        <div>累计公里</div>
                    </div>
                    <div>
                        <SkText :skeleton-show="userStats.total_days == null"
                            class="number">
                            {{userStats.total_days}}
                        </SkText>
                        <div>打卡天数</div>
                    </div>
                    <div>
                        <SkText :skeleton-show="userStats.total_time == null"
                            class="number">
                            {{Math.floor(userStats.total_time / 60 * 100) / 100}}
                        </SkText>
                        <div>累计小时</div>
                    </div>
                </div>
            </section>
            <section v-if="questionList.length>0" class="help" @click="onClickQ" >
                <i class="icon q">&#xe600;</i>
                <swiper ref="question" :options="qSwiperOption">
                    <swiperSlide v-for="(item, index) in questionList" :key="index">
                        <div class="title">{{item.q}}</div>
                    </swiperSlide>
                </swiper>
                <i class="icon right">&#xe63c;</i>
            </section>
            <section class="menu-info">
                <div class="title large-text">我的服务</div>
                <div class="menu">
                    <div @click="onClickBadge" class="menu-item">
                        <div><i class="icon">&#xe603;</i></div>
                        <div class="label">我的成就</div>
                    </div>
                    <div  @click="onClickTrainingPlan" class="menu-item">
                        <div><i class="icon">&#xe60a;</i></div>
                        <div class="label">训练计划</div>
                    </div>
                    <div @click="onClickMonitor" class="menu-item">
                        <div><i class="icon">&#xe604;</i></div>
                        <div class="label">{{hasMonitorTeam ? '战队管理' : '担任队长'}}</div>
                    </div>
                    <div @click="onClickLogistic" class="menu-item">
                        <div><i class="icon">&#xe606;</i></div>
                        <div class="label">我的物流</div>
                    </div>
                    <div @click="onClickAccount" class="menu-item">
                        <div><i class="icon">&#xe601;</i></div>
                        <div class="label">我的钱包</div>
                    </div>
                    <div @click="onClickFeedback" class="menu-item">
                        <div><i class="icon">&#xe600;</i></div>
                        <div class="label">问题咨询</div>
                    </div>
                    <div @click="onClickNotification" class="menu-item">
                        <div>
                            <i class="icon">&#xe60c;</i>
                            <i v-if=" redPoint.notify || redPoint.reply || redPoint.like" class="icon" :class="{'red-icon':  redPoint.notify || redPoint.reply || redPoint.like}">&#xe608;</i>
                        </div>
                        <div class="label">消息通知</div>
                    </div>
                    <div @click="onClickSetting" class="menu-item">
                        <div><i class="icon">&#xe602;</i></div>
                        <div class="label">打卡设置</div>
                    </div>
                </div>
            </section>
        </div>

        <ListSection v-if="adList && adList.length > 0">
            <swiper :options="swiperOption">
                <swiperSlide v-for="(ad, key) in adList"
                    :key="key"
                    @click.native="onClickAd(ad)">
                    <div class="banner" :style="{'background-image': 'url(' + ad.image + ')'}" ></div>
                </swiperSlide>
            </swiper>
        </ListSection>

        <TabBar :selected="5"></TabBar>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ROUTE_NAME, URL_BE_MONITOR } from '@/lib/constant';
import TabBar from '@/components/nav/tabBar.vue';
import store from '@/store';
import Toast from '@/components/toast/toast';
import Clipboard from 'clipboard';

let clipboard: ClipboardJS | null = null;
@Component({
    name: 'UserHome',
    components: {
        TabBar,
    },
})
export default class UserHome extends Vue {
    /** swipe */
    public swiperOption: object = {
        spaceBetween: 30,
        centeredSlides: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
    };

    public qSwiperOption: object = {
        direction: 'vertical',
        loop: true,
        speed: 2000,
        autoplay: true,
        observer: true,
        observeParents: true,
    };

    public get activityIds(): string[] {
        return store.getters['activity/activityIds'];
    }
    public get allMonitorActivityIds(): string[] {
        return store.getters['activity/allMonitorActivityIds'];
    }
    /** 用户基础信息 */
    public get userBasicInfo() {
        return store.state.user.basicInfo!;
    }
    public get userStats() {
        return store.state.user.stats;
    }
    /** 是否有通知红点 */
    public get redPoint() {
        return store.state.notify.redPoint;
    }
    /** 管理的战队 */
    public get hasMonitorTeam() {
        return store.getters['monitor/hasMonitorTeam'];
    }
    /** ad */
    public get adList() {
        return store.state.util.adList;
    }

    public get useSafeArea() {
        return store.state.util.useSafeArea;
    }
    /** 管理班级活动id */
    public get mainMonitorActivityId() {
        return store.getters['monitor/mainMonitorActivityId'];
    }
    /** 队长申请活动id */
    public get mainMonitorApplyActivityId() {
        return store.getters['monitor/mainMonitorApplyActivityId'];
    }

    /** 热门问题列表 */
    public get questionList() {
        const list = store.state.feedback.questionList.hot || [];
        return list.map((item) => ({
            q: item.question,
            a: item.answer,
            link_text: item.link_text,
            link_url: item.link_url,
            image: item.image,
        }));
    }

    /**
     * 点击信息
     */
    public onClickInfo(): void {
        this.$router.push({
            name: ROUTE_NAME.USER_INFO,
        });
    }
    // /**
    //  * 打卡记录
    //  */
    // public onClickSignInRecord(): void {
    //     this.$router.push({
    //         name: ROUTE_NAME.SIGN_IN_RECORD,
    //     });
    // }
    /**
     * 我的勋章
     */
    public onClickBadge(): void {
        this.$router.push({
            name: ROUTE_NAME.BADGE,
        });
    }
    /**
     * 打卡审核
     */
    public onClickCheck(): void {
        this.$router.push({
            name: ROUTE_NAME.CHECK,
        });
    }
    /**
     * 点击物流
     */
    public onClickLogistic(): void {
        this.$router.push({
            name: ROUTE_NAME.SHOP_ORDER_LIST,
        });
    }
    /**
     * 动态
     */
    public onClickShop(): void {
        this.$router.push({
            name: ROUTE_NAME.MALL,
        });
    }
    /**
     * 点击成为队长
     */
    public async onClickMonitor() {
        if (this.hasMonitorTeam) {
            this.$router.push({
                name: ROUTE_NAME.TEAM_MANAGE_LIST,
                params: {
                    activityId: this.mainMonitorActivityId,
                },
            });
        } else {
            // 申请成为队长
            this.$router.push({
                name: ROUTE_NAME.CREATE_TEAM_MONITOR_INFO,
                params: {
                    activityId: this.mainMonitorApplyActivityId,
                },
            });
        }
    }
    /**
     * 点击问题咨询
     */
    public onClickFeedback(): void {
        this.$router.push({
            name: ROUTE_NAME.FEEDBACK,
        });
    }
    /**
     * 点击消息通知
     */
    public onClickNotification(): void {
        this.$router.push({
            name: ROUTE_NAME.USER_NOTIFICATION,
        });
    }
    /**
     * 点击功能设置
     */
    public onClickSetting(): void {
        this.$router.push({
            name: ROUTE_NAME.USER_SETTING,
        });
    }
    /**
     * ad
     */
    public onClickAd(ad: Activity.Ad): void {
        location.href = ad.url;
    }
    /**
     * 点击账户
     */
    public onClickAccount(): void {
        this.$router.push({
            name: ROUTE_NAME.USER_WALLET,
        });
    }

    /** 点击训练计划 */
    public onClickTrainingPlan() {
        this.$router.push({
            name: ROUTE_NAME.TRAINING_PLAN_INDEX,
        });
    }

    public onClickQ() {
        // @ts-ignore 获取索引
        const questionIndex = this.$refs.question.swiper.realIndex;
        this.$router.push({
            name: ROUTE_NAME.FEEDBACK_CATEGORY,
            params: {
                categoryId: 'hot',
                questionIndex,
            },
        });
    }

    public created() {
        Promise.all([
            this.allMonitorActivityIds.forEach((activityId) => {
                store.dispatch({
                    type: 'monitor/getTeamList',
                    activityId,
                });
            }),
            store.dispatch('user/getStats'),
            store.dispatch('notify/checkRedPoint'),
            store.dispatch('getUserCenterAd'),
            store.dispatch({
                type: 'feedback/getQuestionList',
                isHot: 1,
            }),
        ]);

    }

    public mounted() {
        clipboard = new Clipboard('.btn-copy');
        clipboard.on('success', () => {
            Toast('复制成功');
        });
        clipboard.on('error', () => {
            Toast('复制失败');
        });
    }
    public beforeDestroy() {
        if (clipboard) {
            clipboard.destroy();
            clipboard = null;
        }
    }
}
</script>

<style lang="less">
@import "../../lib/style/mixins.less";
@import "../../lib/style/util.less";

.page-user-home {
    min-height: 100%;
    .px2rem6(padding-bottom, @tab-height + 10);
    background-color: @default-bg-color;
    box-sizing: border-box;

    &.safe-area {
        .px2rem6(padding-bottom, @tab-height + 10 + 44);
    }
    .user-info {
        .px2rem6(height, 184);
        .px2rem6(padding, 20, 14);
        color: #ffffff;
        box-sizing: border-box;
        background: linear-gradient(to right, #FF6831, #FF4B18);
        .info {
            display: flex;
            align-items: center;
        }
        .avatar {
            .px2rem6(height, 50);
            .px2rem6(width, 50);
            .px2rem6(margin-right, 8);
            border: 1px solid #EAEAEA;
            border-radius: 100%;
        }
        .nickname {
            .px2rem6(width, 200);
            .px2rem6(margin-bottom, 4);
            font-weight: bold;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }
        .id {
            vertical-align: middle;
            .btn-copy {
                .px2rem6(margin-left, 12);
                .px2rem6(line-height, 17);
                .px2rem6(font-size, 12);
                .px2rem6(padding, 2, 8);
                .px2rem6(border-radius, 21);
                color: #FF432E;
                background: #ffffff;
            }
        }
        .right {
            .px2rem6(font-size, 25);
            margin-left: auto;
        }
        .data {
            .px2rem6(margin-top, 30);
            display: flex;
            align-items: center;
            justify-content: space-around;
            text-align: center;
            .number {
                .huge-text();
                .font-bold();
            }
        }
    }
    .help {
        .px2rem6(height, 44);
        .px2rem6(margin, 0, 14, -10);
        .px2rem6(padding, 10);
        .px2rem6(border-radius, 4);
        .px2rem6(top, -18);
        position: relative;
        box-shadow: 0px 2px 8px 0px #eeeeee;
        background: #ffffff;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        .right {
            margin-left: auto;
            color: #999999;
        }
        .title {
            .px2rem6(margin-left, 4);
            .px2rem6(width, 250);
            .px2rem6(line-height, 44);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap
        }
        .icon {
            .px2rem6(font-size, 20);
        }
        .swiper-container {
           .px2rem6(height, 44);
           width: 100%;
        }
    }
    .menu-info {
        background: #ffffff;
        .title {
            .px2rem6(margin, 10, 14, 0);
            font-weight: bold;
        }
        .menu {
            .px2rem6(padding-bottom, 16);
            display: flex;
            flex-wrap: wrap;
            &-item {
                .px2rem6(margin-top, 12);
                .px2rem6(height, 65);
                width: 25%;
                box-sizing: border-box;
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            }
            .label {
                .px2rem6(margin-top, 8);
                color: #666666;
            }
            .icon {
                .px2rem6(font-size, 27);
                color: black;
            }
            .red-icon {
                .px2rem6(top, 0);
                .px2rem6(right, 28);
                .px2rem6(font-size, 14);
                position: absolute;
                color: #FF1D1D !important;
            }
        }
    }
    .banner {
        width: 100%;
        height: 80px;
        vertical-align: middle;
        background: center no-repeat;
        background-size: cover;
    }
}
</style>
