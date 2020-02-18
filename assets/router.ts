import {
    ROUTE_NAME,
} from '@/lib/constant';
export default [
    {
        path: '/brand/index/:id',
        meta: {
            title: '赛事品牌专题页',
            scrollBehavior: 'restore',
        },
        name: ROUTE_NAME.BRAND_INDEX,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/index.vue"),
    },
    {
        path: '/brand/imgAndVideo/:id/:nav', // nav判断是否加载视频信息
        meta: {
            title: '赛事图频',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_IMG_AND_VIDEO,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/imgAndVideo.vue"),
    },
    {
        path: '/brand/albums/:id/:albumWrapId/:albumWrapName',
        meta: {
            title: '',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_ALBUMS,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/albums.vue"),
    },
    {
        path: '/brand/photoes/:id/:albumWrapId/:albumId',
        meta: {
            title: '赛事品牌专题页',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_PHOTOES,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/photoes.vue"),
    },
    {
        path: '/brand/report/:id',
        meta: {
            title: '赛事报道',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_REPORT,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/report.vue"),
    },
    {
        path: '/brand/cooperation/:id',
        meta: {
            title: '我要合作',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_COOPERATION,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/cooperation.vue"),
    },
    {
        path: '/brand/apply/:id',
        meta: {
            title: '申请合作',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_APPLY,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/apply.vue"),
    },
    {
        path: '/brand/success',
        meta: {
            title: '申请结果',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_SUCESS,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/applyResult.vue"),
    },
    {
        path: '/brand/activities/:id',
        meta: {
            title: '我们的赛事',
            scrollBehavior: 'top',
        },
        name: ROUTE_NAME.BRAND_ACTIVITIES,
        component: () => import(/* webpackChunkName: "router" */
        "@/pages/brand/ourActivities.vue"),
    },
];