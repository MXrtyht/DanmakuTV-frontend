import IndexPageLayout from '@/layouts/IndexPageLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const Index = () => import('../views/IndexPage.vue')
const Login = () => import('../views/LoginPage.vue')
const Register = () => import('../views/RegisterPage.vue')
const HomePage = () => import('../views/HomePage.vue')
const HomepageLayout = () => import('@/layouts/HomepageLayout.vue')
const HomeFollowPage = () => import('@/views/HomeFollowPage.vue')
const HomeEditPage = () => import('../views/HomeEditPage.vue')
const HomeFanPage = () => import('@/views/HomeFanPage.vue')
const HomeCollectVidelPage = () => import('@/views/HomeCollectVideoPage.vue')
const HomeMomentsPage = () => import('@/views/HomeMomentsPage.vue')
const HomeUploadVideoPage = () => import('@/views/HomeUploadVideoPage.vue')
const HistoryPage = () => import('@/views/HistoryPage.vue')
const SearchPage = () => import('@/views/SearchPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '' },

    {
      path: '',
      redirect: '/index',
      component: IndexPageLayout,  // 使用布局组件
      meta: { requestAuth: true },
      children: [
        {
          path: '/index',
          component: Index,
          meta: { requestAuth: true },
        },
        // 视频详情页路由
        {
          path: '/video/:videoId',
          component: () => import('@/views/VideoPage.vue'),
          name: 'video',
          meta: { requestAuth: true },
        },
        {
          path: '/history',
          component: HistoryPage,
          name: 'history',
          meta: { requestAuth: true },
        },
      ],
    },

    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requestAuth: false },
    },

    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { requestAuth: false },
    },
    {
      path: '/test', // 测试专用路由
      component: () => import('@/test/TestHeaderBar.vue'),
      meta: { isTest: true }, // 标记为测试路由
    },
    {
      path: '/search',
      component: SearchPage,
      name: 'search',
      meta: { requestAuth: true },
    },
    {
      path: '/home',
      component: HomepageLayout,
      children: [
        { path: '', component: HomePage },
        { path: 'follow', component: HomeFollowPage },
        { path: 'edit', component: HomeEditPage },
        { path: 'fan', component: HomeFanPage },
        { path: 'collect', component: HomeCollectVidelPage },
        { path: 'moment', component: HomeMomentsPage},
        { path: 'uploadVideo', component: HomeUploadVideoPage },
      ],
    },
    {
      path: '/index',
      component: IndexPageLayout,
      children: [
        { path: '', component: Index },
        { path: 'video/:videoId', component: () => import('@/views/VideoPage.vue'), name: 'video' }, // 视频页
      ],
    },
  ],
})

// 路由守卫 判断用户是否登录
router.beforeEach((to, from, next) => {
  if (to.meta.requestAuth && !localStorage.getItem('user_token')) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
