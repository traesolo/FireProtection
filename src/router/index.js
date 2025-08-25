import { createRouter, createWebHashHistory } from 'vue-router'

const Home = () => import('@/views/Home.vue')
const LiShi = () => import('@/views/jilu.vue')
const Log = () => import('@/views/Log.vue')

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
        path: '/log',
        name: 'Log',
        component: Log,
        meta: {
            title: '系统日志 - 消防检测系统'
        }
    },

    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title
    }
    next()
})

export default router