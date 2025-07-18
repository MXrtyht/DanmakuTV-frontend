import { createRouter, createWebHistory } from 'vue-router'

const Index = () => import('../views/IndexPage.vue')
const Login = () => import('../views/LoginPage.vue')
const Register = () => import('../views/RegisterPage.vue')
const HomePage = () => import('../views/HomePage.vue')
const HomepageLayout = () => import( '@/layouts/HomepageLayout.vue')
const HomeFollowPage = () => import('@/views/HomeFollowPage.vue')
const EditPage = () => import('../views/EditPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '' },

    {
      path: '',
      redirect: '/index',
      component: Index,
      meta: { requestAuth: true },
      children: [
        {
          path: '/index',
          component: Index,
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
      meta: { isTest: true } // 标记为测试路由
    },
    {
      path: '/home',
      component: HomepageLayout,
      children: [
        { path: '', redirect: '/home' },
        { path: 'home', component: HomePage },
        { path: 'follow', component: HomeFollowPage },
        { path: 'edit', component: EditPage }
      ]
    }
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
