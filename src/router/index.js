import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('@/views/Home.vue')
const LiShi = () => import('@/views/jilu.vue')

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        meta: {
            title: '消防检测系统'
        }
    },
    {
        path: '/LiShi',
        name: 'LiShi',
        component: LiShi,
        meta: {
            title: '消防检测系统'
        }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title
    }
    next()
})

export default router