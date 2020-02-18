import {
    ROUTE_NAME,
} from '@/lib/constant';
const BrandIndex = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/index.vue'));
    }, 'brandIndex');
};

const ImgAndVideo = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/imgAndVideo.vue'));
    }, 'imgAndVideo');
};

const Albums = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/albums.vue'));
    }, 'albums');
};

const Photoes = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/photoes.vue'));
    }, 'photoes');
};

const Report = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/report.vue'));
    }, 'report');
};

const Cooperation = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/cooperation.vue'));
    }, 'cooperation');
};

const Apply = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/apply.vue'));
    }, 'apply');
};

const ApplyResult = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/applyResult.vue'));
    }, 'applyResult');
};

const OurActivities = resolve => {
    require.ensure([], (require) => {
        resolve(require('@/pages/brand/ourActivities.vue'));
    }, 'ourActivities');
};
export default [
    {
        path: '/brand/index/:id',
        meta: {
            title: '赛事品牌专题页',
            scrollBehavior: 'restore',
        },
        name: ROUTE_NAME.BRAND_INDEX,
        component: BrandIndex,
    },
    {
        path: '/brand/imgAndVideo/:id/:nav', // nav判断是否加载视频信息
        meta: {
            title: '赛事图频',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_IMG_AND_VIDEO,
        component: ImgAndVideo,
    },
    {
        path: '/brand/albums/:id/:albumWrapId/:albumWrapName',
        meta: {
            title: '',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_ALBUMS,
        component: Albums,
    },
    {
        path: '/brand/photoes/:id/:albumWrapId/:albumId',
        meta: {
            title: '赛事品牌专题页',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_PHOTOES,
        component: Photoes,
    },
    {
        path: '/brand/report/:id',
        meta: {
            title: '赛事报道',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_REPORT,
        component: Report,
    },
    {
        path: '/brand/cooperation/:id',
        meta: {
            title: '我要合作',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_COOPERATION,
        component: Cooperation,
    },
    {
        path: '/brand/apply/:id',
        meta: {
            title: '申请合作',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_APPLY,
        component: Apply,
    },
    {
        path: '/brand/success',
        meta: {
            title: '申请结果',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_SUCESS,
        component: ApplyResult,
    },
    {
        path: '/brand/activities/:id',
        meta: {
            title: '我们的赛事',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_ACTIVITIES,
        component: OurActivities,
    },
];