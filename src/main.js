import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
// MQTT服务已移除，改用HTTP轮询
// 设备store已移至api/device.js
// import './style.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 日志重定向功能已移除
console.log('应用启动')

// Linux ARM64 输入框修复样式
if (navigator.userAgent.includes('Linux') && (navigator.userAgent.includes('aarch64') || navigator.userAgent.includes('arm64'))) {
    import('./assets/linux-arm64-fix.css')
}
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
    locale: zhCn,
})

// HTTP轮询已在组件中自动启动，无需在此处初始化

app.mount('#app')