<template>
    <div class="home">
        <!-- 头部区域 -->
        <div class="header">
            <div class="datetime">{{ currentTime }}</div>
            <div class="title">消防设备终端</div>
            <div class="controls">
                <div class="control-item" @click="handleSettings">
                    <img :src="sehzhiImg" alt="设置" class="control-icon" />
                    <span>设置</span>
                </div>
                <div class="control-item" @click="handleExit">
                    <img :src="guanImg" alt="关闭" class="control-icon" />
                    <span>退出</span>
                </div>
            </div>
        </div>

        <!-- 中间监控区域 -->
        <div class="monitor-section">
            <div class="monitor-container">
                <div class="monitor-area">
                    <div class="screenshot-btn" @click="captureLeft">
                        <img :src="imgIcon" alt="截图" class="screenshot-icon" />
                    </div>
                    <div class="monitor-content">
                        <!-- 监控显示区域 -->
                        <div class="monitor-display" id="monitor-left">
                            <video v-if="safeVideoStreams.left.active" key="left-video" autoplay muted playsinline
                                style="width: 100%; height: 100%; object-fit: cover;"
                                @error="handleVideoError('left', $event)"></video>
                            <div v-else-if="safeVideoStreams.left.loading" key="left-loading"
                                class="monitor-placeholder">
                                正在连接摄像头...</div>
                            <div v-else-if="safeVideoStreams.left.error" key="left-error" class="monitor-placeholder">
                                连接失败: {{ safeVideoStreams.left.error || '未知错误' }}</div>
                            <div v-else key="left-default" class="monitor-placeholder">监控区域1</div>
                        </div>
                    </div>
                </div>
                <div class="monitor-area">
                    <div class="screenshot-btn" @click="captureRight">
                        <img :src="imgIcon" alt="截图" class="screenshot-icon" />
                    </div>
                    <div class="monitor-content">
                        <!-- 监控显示区域 -->
                        <div class="monitor-display" id="monitor-right">
                            <video v-if="safeVideoStreams.right.active" key="right-video" autoplay muted playsinline
                                style="width: 100%; height: 100%; object-fit: cover;"
                                @error="handleVideoError('right', $event)"></video>
                            <div v-else-if="safeVideoStreams.right.loading" key="right-loading"
                                class="monitor-placeholder">正在连接摄像头...</div>
                            <div v-else-if="safeVideoStreams.right.error" key="right-error" class="monitor-placeholder">
                                连接失败: {{ safeVideoStreams.right.error || '未知错误' }}</div>
                            <div v-else key="right-default" class="monitor-placeholder">监控区域2</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="sehbeihao">
            <div class="left-item">
                <div class="status-title">设备编号：{{ deviceName }}</div>
                <div class="status-subtitle" data-text="等管道泡沫度清洁后，再回收软管！">等管道泡沫度清洁后，再回收软管！</div>
            </div>
            <div class="right-item">
                <div class="alarm-title">告警列表</div>
                <div class="alarm-subtitle" @click="todetail">查看历史记录</div>
            </div>
        </div>

        <!-- 底部设备状态区域 -->
        <div class="bottom-section">
            <!-- 左侧设备状态 -->
            <div class="device-status">
                <div class="device-grid">
                    <div class="device-group" v-for="(group, groupIndex) in safeDeviceGroups"
                        :key="group?.id || 'group-' + groupIndex">
                        <div class="device-item" v-for="(device, deviceIndex) in (group?.devices || [])"
                            :key="device?.id || 'device-' + groupIndex + '-' + deviceIndex"
                            :class="device?.status || 'online'">
                            <div class="my">
                                <img :src="device?.icon || ''" class="device-icon" />
                                <div class="device-name">{{ device?.name || '' }}</div>
                            </div>
                            <div class="device-status-text">{{ device?.statusText || '' }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧告警列表 -->
            <div class="alarm-section">
                <el-table :data="alarmData || []" height="178" class="alarm-table">
                    <el-table-column prop="id" label="序号" width="56" align="center" />
                    <el-table-column prop="name" label="设备名称" width="98" align="center" />
                    <el-table-column prop="status" label="报警信息" width="76" align="center" />
                    <el-table-column prop="productTime" label="产生时间" width="128" align="center" />
                    <el-table-column prop="endTime" label="结束时间" width="128" align="center" />
                </el-table>
            </div>
        </div>

        <!-- 登录弹窗 -->
        <el-dialog v-model="showLoginDialog" :width="293" :show-close="false" :modal="true" :close-on-click-modal="true"
            :close-on-press-escape="true" class="login-dialog" center title="" :append-to-body="false"
            :lock-scroll="false" @close="clearLoginForm">
            <div class="login-content">
                <div class="input-section">
                    <!-- 账号输入 -->
                    <div class="input-group account-input">
                        <div class="input-icon">
                            <img :src="userImg" alt="用户" />
                        </div>
                        <input v-model="loginForm.username" type="text" placeholder="请输入账号" class="input-field" />
                    </div>

                    <!-- 密码输入 -->
                    <div class="input-group">
                        <div class="input-icon">
                            <img :src="passImg" alt="密码" />
                        </div>
                        <input v-model="loginForm.password" type="password" placeholder="请输入密码" class="input-field" />
                    </div>
                </div>

                <div class="button-section" @click="handleConfirm">
                    确定
                </div>
            </div>
        </el-dialog>

        <!-- 设备参数设置弹窗 -->
        <el-dialog v-model="showSettingsDialog" width="401px" :show-close="false" class="settings-dialog"
            @close="clearSettingsForm">
            <div class="settings-container">
                <div class="settings-content">
                    <el-form :model="settingsForm" class="settings-form">
                        <div class="form-item">
                            <label class="form-label">站号:</label>
                            <el-input v-model="settingsForm.stationNumber" placeholder="请输入站号" class="form-input"
                                @input="validateNumberInput('stationNumber', $event)" />
                        </div>
                        <div class="form-item">
                            <label class="form-label">设备编号:</label>
                            <el-input v-model="settingsForm.name" placeholder="请输入设备编号" class="form-input"
                                @input="validateStringInput('name', $event)" />
                        </div>

                        <div class="form-item">
                            <label class="form-label">水压监测阈值:</label>
                            <el-input v-model="settingsForm.waterPressureThreshold" placeholder="请输入水压监测阈值"
                                class="form-input" @input="validateNumberInput('waterPressureThreshold', $event)" />
                            <span class="form-unit">Mpa</span>
                        </div>
                        <div class="form-item">
                            <label class="form-label">泡沫灭火剂监测阈值:</label>
                        </div>
                        <div class="form-item">
                            <label class="form-label">高液位:</label>
                            <el-input v-model="settingsForm.highLiquidLevelThreshold" placeholder="请输入高液位阈值"
                                class="form-input" @input="validateNumberInput('highLiquidLevelThreshold', $event)" />
                            <span class="form-unit">L</span>
                        </div>
                        <div class="form-item">
                            <label class="form-label">中液位:</label>
                            <el-input v-model="settingsForm.midLiquidLevelThreshold" placeholder="请输入中液位阈值"
                                class="form-input" @input="validateNumberInput('midLiquidLevelThreshold', $event)" />
                            <span class="form-unit">L</span>
                        </div>
                        <div class="form-item">
                            <label class="form-label">低液位:</label>
                            <el-input v-model="settingsForm.lowLiquidLevelThreshold" placeholder="请输入低液位阈值"
                                class="form-input" @input="validateNumberInput('lowLiquidLevelThreshold', $event)" />
                            <span class="form-unit">L</span>
                        </div>
                        <div class="form-item">
                            <label class="form-label">预警时间阈值:</label>
                            <el-input v-model="settingsForm.warningTimeThreshold" placeholder="请输入预警时间阈值"
                                class="form-input" @input="validateNumberInput('warningTimeThreshold', $event)" />
                            <span class="form-unit">min</span>
                        </div>
                        <div class="form-item">
                            <label class="form-label">采集数据时间:</label>
                            <el-input v-model="settingsForm.time" placeholder="请输入采集数据时间" class="form-input"
                                @input="validateNumberInput('time', $event)" />
                            <span class="form-unit">s</span>
                        </div>
                        <div class="form-item">
                            <label class="form-label">寄存器地址:</label>
                            <el-input v-model="settingsForm.registerAddress" placeholder="请输入寄存器地址"
                                class="form-input" @input="validateNumberInput('registerAddress', $event)" />
                        </div>
                        <div class="form-item">
                            <label class="form-label">上传图片:</label>
                            <el-upload class="upload-demo" action="/fire-monitor/api/upload/image"
                                :show-file-list="false" :on-success="handleUploadSuccess" :on-error="handleUploadError"
                                :before-upload="beforeUpload" accept="image/*">
                                <div class="upload-button" v-if="!settingsForm.uploadedImageUrl">
                                    选择图片
                                </div>
                                <div class="uploaded-image-preview" v-else>
                                    <img :src="settingsForm.uploadedImageUrl" alt="上传的图片" />
                                    <div class="image-overlay">
                                        <span>重新上传</span>
                                    </div>
                                </div>
                            </el-upload>
                        </div>
                        <div class="form-item">
                            <label class="form-label">设备名称:</label>
                            <el-input v-model="settingsForm.deviceName" placeholder="请输入设备名称" class="form-input"
                                @input="validateStringInput('deviceName', $event)" />
                        </div>
                        <div class="form-item tishi">
                            该设备对应的是主页水压检测设备下空余位置的设别设置，若调整名称，请注意该设备的状态是否和“灭火站的状态一致，若不一致请调整
                        </div>
                    </el-form>
                </div>
                <div class="settings-footer">
                    <div @click="handleSettingsConfirm" class="confirm-btn">
                        完成
                    </div>
                </div>
            </div>
        </el-dialog>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElTable, ElTableColumn, ElDialog, ElMessage, ElUpload } from 'element-plus'
import html2canvas from 'html2canvas'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '../api/device'
import request from '../utils/request'
import { API_CONFIG, buildUrl } from '../config/api'
import { VideoStreamManager } from '../utils/videoStream.js'
import Hls from 'hls.js'

// 监控摄像头配置
const monitorConfig = {
    camera1: {
        id: 'monitor-left',
        name: '监控摄像头1',
        ip: '192.168.1.64',
        port: 554,
        username: 'admin',
        password: 'qwe13579',
        channel: 1,
        containerId: 'monitor-left'
    },
    camera2: {
        id: 'monitor-right',
        name: '监控摄像头2',
        ip: '192.168.1.64',
        port: 554,
        username: 'admin',
        password: 'qwe13579',
        channel: 2,
        containerId: 'monitor-right'
    }
}

// 视频流管理器
const videoStreamManager = new VideoStreamManager()

// 组件卸载标志
const isUnmounted = ref(false)

// 视频流状态
const videoStreams = ref({
    left: {
        active: false,
        loading: false,
        error: null,
        hlsUrl: null,
        hlsInstance: null
    },
    right: {
        active: false,
        loading: false,
        error: null,
        hlsUrl: null,
        hlsInstance: null
    }
})

// 安全的视频流状态访问器
const safeVideoStreams = computed(() => {
    const defaultStream = { active: false, loading: false, error: null, hlsUrl: null, hlsInstance: null }

    if (isUnmounted.value || !videoStreams.value) {
        return {
            left: { ...defaultStream },
            right: { ...defaultStream }
        }
    }

    // 确保每个流对象都有完整的属性
    const streams = videoStreams.value
    return {
        left: {
            active: streams.left?.active || false,
            loading: streams.left?.loading || false,
            error: streams.left?.error || null,
            hlsUrl: streams.left?.hlsUrl || null,
            hlsInstance: streams.left?.hlsInstance || null
        },
        right: {
            active: streams.right?.active || false,
            loading: streams.right?.loading || false,
            error: streams.right?.error || null,
            hlsUrl: streams.right?.hlsUrl || null,
            hlsInstance: streams.right?.hlsInstance || null
        }
    }
})

// 启动视频流
const startVideoStream = async (position) => {
    const config = position === 'left' ? monitorConfig.camera1 : monitorConfig.camera2

    try {
        // 检查组件是否已卸载
        if (isUnmounted.value) {
            console.warn(`组件已卸载，跳过${position}视频流启动`)
            return
        }

        // 安全检查
        if (!videoStreams || !videoStreams.value || !videoStreams.value[position]) {
            console.error(`${position}视频流状态对象不存在`)
            return
        }

        // 使用try-catch保护响应式对象访问
        try {
            if (!isUnmounted.value) {
                videoStreams.value[position].loading = true
                videoStreams.value[position].error = null
                videoStreams.value[position].active = false
            }
        } catch (reactiveError) {
            console.warn('设置视频流状态时发生错误:', reactiveError)
            return
        }

        const result = await videoStreamManager.startStream(config)

        if (result.success) {
            try {
                if (!isUnmounted.value && videoStreams.value && videoStreams.value[position]) {
                    videoStreams.value[position].hlsUrl = result.hlsUrl
                    console.log(`${position}视频流启动成功:`, result.hlsUrl)

                    // 先设置 active 状态，让 video 元素渲染到 DOM
                    videoStreams.value[position].active = true

                    // 等待DOM更新后初始化HLS播放器
                    await nextTick()
                    // 添加额外延迟确保DOM完全渲染
                    await new Promise(resolve => setTimeout(resolve, 100))

                    // 再次检查组件是否已卸载
                    if (!isUnmounted.value) {
                        await initHlsPlayer(position, result.hlsUrl)
                    }
                }
            } catch (reactiveError) {
                console.warn('更新视频流成功状态时发生错误:', reactiveError)
            }
        } else {
            try {
                if (!isUnmounted.value && videoStreams.value && videoStreams.value[position]) {
                    videoStreams.value[position].error = result.error || '启动失败'
                }
            } catch (reactiveError) {
                console.warn('设置视频流错误状态时发生错误:', reactiveError)
            }
            console.error(`${position}视频流启动失败:`, result.error)
        }
    } catch (error) {
        try {
            if (!isUnmounted.value && videoStreams && videoStreams.value && videoStreams.value[position]) {
                videoStreams.value[position].error = error.message || '连接异常'
            }
        } catch (reactiveError) {
            console.warn('设置视频流异常状态时发生错误:', reactiveError)
        }
        console.error(`${position}视频流异常:`, error)
    } finally {
        try {
            if (!isUnmounted.value && videoStreams && videoStreams.value && videoStreams.value[position]) {
                videoStreams.value[position].loading = false
            }
        } catch (reactiveError) {
            console.warn('重置视频流loading状态时发生错误:', reactiveError)
        }
    }
}

// 初始化HLS播放器
const initHlsPlayer = async (position, hlsUrl) => {
    try {
        // 检查组件是否已卸载
        if (isUnmounted.value) {
            console.warn(`组件已卸载，跳过${position}HLS播放器初始化`)
            return
        }

        // 等待更长时间确保DOM更新完成
        await new Promise(resolve => setTimeout(resolve, 200))

        // 再次检查组件是否已卸载
        if (isUnmounted.value) {
            console.warn(`组件已卸载，停止${position}HLS播放器初始化`)
            return
        }

        // 添加更多的重试机制和错误处理
        let videoElement = null
        let retryCount = 0
        const maxRetries = 10

        while (!videoElement && retryCount < maxRetries) {
            // 检查组件是否已卸载
            if (isUnmounted.value) {
                console.warn(`组件已卸载，停止${position}视频元素查找`)
                return
            }

            // 确保容器元素存在
            const containerElement = document.querySelector(`#monitor-${position}`)
            if (!containerElement) {
                console.warn(`第${retryCount + 1}次尝试：找不到${position}容器元素，等待DOM渲染...`)
                await new Promise(resolve => setTimeout(resolve, 200))
                retryCount++
                continue
            }

            videoElement = containerElement.querySelector('video')
            if (!videoElement) {
                console.warn(`第${retryCount + 1}次尝试：找不到${position}视频元素，等待DOM渲染...`)
                await new Promise(resolve => setTimeout(resolve, 200))
                retryCount++
            }
        }

        if (!videoElement) {
            console.error(`经过${maxRetries}次尝试后仍找不到${position}视频元素，DOM可能未正确渲染`)
            if (!isUnmounted.value && videoStreams.value && videoStreams.value[position]) {
                videoStreams.value[position].error = 'DOM元素未找到'
            }
            return
        }

        // 检查是否在浏览器环境下的模拟模式
        const isElectron = window.electronAPI !== undefined
        if (!isElectron) {
            console.log(`${position}视频流在浏览器环境下运行，跳过HLS播放器初始化`)
            // 在浏览器环境下，视频流由createMockVideoStream处理
            return
        }

        // 销毁现有的HLS实例
        if (videoStreams.value[position].hlsInstance) {
            videoStreams.value[position].hlsInstance.destroy()
            videoStreams.value[position].hlsInstance = null
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            })

            hls.loadSource(hlsUrl)
            hls.attachMedia(videoElement)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log(`${position}视频流HLS清单解析完成，开始播放`)
                videoElement.play().catch(e => {
                    console.error(`${position}视频播放失败:`, e)
                })
            })

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error(`${position}视频流HLS错误:`, data)

                // 检查组件是否已经卸载，防止访问已销毁的响应式对象
                if (isUnmounted.value) {
                    console.warn(`组件已卸载，跳过${position}视频流错误处理`)
                    return
                }

                try {
                    // 添加null检查，防止访问null对象的属性
                    if (data && data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('网络错误，尝试恢复')
                                hls.startLoad()
                                break
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log('媒体错误，尝试恢复')
                                hls.recoverMediaError()
                                break
                            default:
                                console.log('无法恢复的错误，销毁播放器')
                                hls.destroy()
                                // 安全地更新状态，检查响应式对象是否仍然有效
                                if (!isUnmounted.value && videoStreams && videoStreams.value && videoStreams.value[position]) {
                                    videoStreams.value[position].error = '播放器错误'
                                }
                                break
                        }
                    } else if (data) {
                        // 非致命错误的处理
                        console.warn(`${position}视频流非致命错误:`, data)
                    } else {
                        // data为null的情况
                        console.warn(`${position}视频流错误，但错误数据为空`)
                    }
                } catch (error) {
                    // 捕获可能的响应式对象访问错误
                    console.warn(`处理${position}视频流错误时发生异常:`, error)
                }
            })

            videoStreams.value[position].hlsInstance = hls
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari原生支持HLS
            videoElement.src = hlsUrl
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play().catch(e => {
                    console.error(`${position}视频播放失败:`, e)
                })
            })
        } else {
            console.error('浏览器不支持HLS播放')
            videoStreams.value[position].error = '浏览器不支持HLS播放'
        }
    } catch (error) {
        console.error(`初始化${position}HLS播放器失败:`, error)
        if (!isUnmounted.value && videoStreams.value && videoStreams.value[position]) {
            videoStreams.value[position].error = '播放器初始化失败'
        }
    }
}

// 停止视频流
const stopVideoStream = async (position) => {
    const config = position === 'left' ? monitorConfig.camera1 : monitorConfig.camera2

    try {
        // 安全检查
        if (!videoStreams.value || !videoStreams.value[position]) {
            console.warn(`${position}视频流状态对象不存在，无法停止`)
            return
        }

        // 销毁HLS实例
        if (videoStreams.value[position].hlsInstance) {
            videoStreams.value[position].hlsInstance.destroy()
            videoStreams.value[position].hlsInstance = null
        }

        await videoStreamManager.stopStream(config.id)
        videoStreams.value[position].active = false
        videoStreams.value[position].hlsUrl = null
        videoStreams.value[position].error = null
        console.log(`${position}视频流已停止`)
    } catch (error) {
        console.error(`停止${position}视频流失败:`, error)
    }
}

// 处理视频错误
const handleVideoError = (position, event) => {
    console.error(`${position}视频播放错误:`, event)
    if (!isUnmounted.value && videoStreams.value && videoStreams.value[position]) {
        videoStreams.value[position].error = '视频播放失败'
        videoStreams.value[position].active = false
    }
}

// 启动所有视频流
const startAllVideoStreams = async () => {
    console.log('开始启动所有视频流...')
    await Promise.all([
        startVideoStream('left'),
        startVideoStream('right')
    ])
}

// 停止所有视频流
const stopAllVideoStreams = async () => {
    console.log('停止所有视频流...')
    await Promise.all([
        stopVideoStream('left'),
        stopVideoStream('right')
    ])
}

// 导入图片资源
import shuidaiImg from '/static/index/shuidai.png'
import shuiqiangImg from '/static/index/shuiqiang.png'
import miehuoImg from '/static/index/miehuo.png'
import menImg from '/static/index/men.png'
import paomoImg from '/static/index/paomo.png'
import shuiyajiancheImg from '/static/index/shuiyajianche.png'
import sehzhiImg from '/static/index/sehzhi.png'
import guanImg from '/static/index/guan.png'
import imgIcon from '/static/index/img.png'
import userImg from '/static/index/user.png'
import passImg from '/static/index/pass.png'

const router = useRouter()
const deviceStore = useDeviceStore()

const todetail = () => {
    router.push({ name: 'LiShi' })
}
// 当前时间
const currentTime = ref('')

// 弹窗控制
const showLoginDialog = ref(false)
const showSettingsDialog = ref(false)
const loginForm = ref({
    username: '',
    password: '',
    action: 'settings' // 'settings' 或 'exit'
})

// 设备参数设置表单数据
const settingsForm = ref({
    stationNumber: '',
    waterPressureThreshold: '',
    highLiquidLevelThreshold: '',
    midLiquidLevelThreshold: '',
    lowLiquidLevelThreshold: '',
    warningTimeThreshold: '',
    time: '',
    name: '',
    registerAddress: '',
    deviceName: '',
    uploadedImage: '',
    uploadedImageUrl: ''
})

// 专门用于存储拼接后的完整图片路径，用于接口传参
const fullImagePath = ref('')

// 设备名称显示数据
const deviceName = ref('YK1+123') // 默认值

// 开发环境检测
const isDevelopment = ref(process.env.NODE_ENV === 'development')

// 报警状态管理
const alarmState = ref({
    isAlarming: false,
    isWarning: false,
    alarmTimer: null,
    warningTimer: null,
    flashTimer: null,
    warningFlashTimer: null,
    audioContext: null,
    oscillator: null,
    gainNode: null,
    warningAudioContext: null,
    warningOscillator: null,
    warningGainNode: null
})

// 获取设备参数数据
const fetchThresholds = async () => {
    try {
        const response = await request.get(API_CONFIG.ENDPOINTS.THRESHOLDS)
        if (response.data) {
            settingsForm.value = {
                ...settingsForm.value,
                waterPressureThreshold: response.data.waterPressureThreshold || '',
                highLiquidLevelThreshold: response.data.highLiquidLevelThreshold || '',
                midLiquidLevelThreshold: response.data.midLiquidLevelThreshold || '',
                lowLiquidLevelThreshold: response.data.lowLiquidLevelThreshold || '',
                warningTimeThreshold: response.data.warningTimeThreshold || '',
                time: response.data.time || '',
                name: response.data.name || ''
            }
            // 更新设备名称显示
            deviceName.value = response.data.name || 'YK1+123'
        }
    } catch (error) {
        console.error('获取设备参数失败:', error)
    }
}

// 获取设备号数据
const fetchStationNumber = async () => {
    try {
        const response = await request.get(API_CONFIG.ENDPOINTS.STATION)
        if (response.data) {
            settingsForm.value.stationNumber = response.data.stationNumber || ''
        }
    } catch (error) {
        console.error('获取设备号失败:', error)
    }
}

// 获取自定义设备信息数据
const fetchCustomDeviceInfo = async () => {
    try {
        const response = await request.get(API_CONFIG.ENDPOINTS.CUSTOM_DEVICE_INFO)
        if (response.data) {
            // 从后端获取的icon路径
            const iconPath = response.data.icon || ''
            let displayPath = iconPath
            
            // 如果有图片路径，根据环境处理显示路径
            if (iconPath) {
                if (process.env.NODE_ENV === 'development') {
                    // 开发环境：直接使用相对路径，让Vite代理服务器处理
                    displayPath = iconPath
                } else {
                    // 生产环境：使用127.0.0.1拼接完整的服务器地址
                    displayPath = iconPath.startsWith('http') ? iconPath : 
                        `http://127.0.0.1${iconPath}`
                }
            }
            
            settingsForm.value = {
                ...settingsForm.value,
                deviceName: response.data.name || '',
                registerAddress: response.data.registerAddress || '',
                uploadedImage: iconPath,
                uploadedImageUrl: displayPath
            }
            // 设置完整路径用于接口传参
            fullImagePath.value = iconPath
        }
    } catch (error) {
        console.error('获取自定义设备信息失败:', error)
    }
}

// 保存设备参数数据
const saveThresholds = async () => {
    try {
        const thresholdsData = {
            waterPressureThreshold: parseFloat(settingsForm.value.waterPressureThreshold) || 0,
            highLiquidLevelThreshold: parseFloat(settingsForm.value.highLiquidLevelThreshold) || 0,
            midLiquidLevelThreshold: parseFloat(settingsForm.value.midLiquidLevelThreshold) || 0,
            lowLiquidLevelThreshold: parseFloat(settingsForm.value.lowLiquidLevelThreshold) || 0,
            warningTimeThreshold: parseInt(settingsForm.value.warningTimeThreshold) || 0,
            time: parseInt(settingsForm.value.time) || 0,
            name: settingsForm.value.name || ''
        }
        await request.put(API_CONFIG.ENDPOINTS.THRESHOLDS, thresholdsData)
        console.log('设备参数保存成功')
    } catch (error) {
        console.error('保存设备参数失败:', error)
    }
}

// 保存设备号数据
const saveStationNumber = async () => {
    try {
        // 后端要求map格式传参，stationNumber为字符串格式
        const stationData = new Map()
        stationData.set('stationNumber', String(settingsForm.value.stationNumber || '1'))

        // 将Map转换为对象格式发送
        const stationObj = Object.fromEntries(stationData)
        await request.post(API_CONFIG.ENDPOINTS.STATION, stationObj)
        console.log('设备号保存成功')
    } catch (error) {
        console.error('保存设备号失败:', error)
    }
}

// 保存自定义设备信息数据
const saveCustomDeviceInfo = async () => {
    try {
        const customDeviceData = {
            id: '',
            name: settingsForm.value.deviceName || '',
            registerAddress: parseInt(settingsForm.value.registerAddress) || 0,
            icon: fullImagePath.value || ''
        }
        await request.post(API_CONFIG.ENDPOINTS.CUSTOM_DEVICE_SAVE, customDeviceData)
        console.log('自定义设备信息保存成功')
    } catch (error) {
        console.error('保存自定义设备信息失败:', error)
    }
}

// 验证账号密码
const verifyPassword = async (username, password) => {
    try {
        const url = buildUrl(API_CONFIG.ENDPOINTS.PASSWORD_CHECK, {
            uname: username,
            pwd: password
        })
        const response = await request.get(url)
        return response.data === true
    } catch (error) {
        console.error('密码验证失败:', error)
        return false
    }
}

const handleSettingsConfirm = async () => {
    await Promise.all([saveThresholds(), saveStationNumber(), saveCustomDeviceInfo()])
    // 重新获取设备参数数据，确保更新后的数据能够渲染出来
    await fetchThresholds()
    showSettingsDialog.value = false
}

// 蜂鸣器报警功能
const createBeepSound = () => {
    try {
        // 创建音频上下文
        alarmState.value.audioContext = new (window.AudioContext || window.webkitAudioContext)()

        // 创建振荡器（产生声音）
        alarmState.value.oscillator = alarmState.value.audioContext.createOscillator()
        alarmState.value.gainNode = alarmState.value.audioContext.createGain()

        // 设置频率为1000Hz（蜂鸣器音调）
        alarmState.value.oscillator.frequency.setValueAtTime(1000, alarmState.value.audioContext.currentTime)
        alarmState.value.oscillator.type = 'square' // 方波，更像蜂鸣器

        // 设置音量（≥80dB相当于 0.8）
        alarmState.value.gainNode.gain.setValueAtTime(0.8, alarmState.value.audioContext.currentTime)

        // 连接音频节点
        alarmState.value.oscillator.connect(alarmState.value.gainNode)
        alarmState.value.gainNode.connect(alarmState.value.audioContext.destination)

        // 开始播放
        alarmState.value.oscillator.start()

        console.log('蜂鸣器报警已启动')
    } catch (error) {
        console.error('创建蜂鸣器声音失败:', error)
    }
}

// 预警蜂鸣器功能
const createWarningBeepSound = () => {
    try {
        // 创建音频上下文
        alarmState.value.warningAudioContext = new (window.AudioContext || window.webkitAudioContext)()

        // 创建振荡器（产生声音）
        alarmState.value.warningOscillator = alarmState.value.warningAudioContext.createOscillator()
        alarmState.value.warningGainNode = alarmState.value.warningAudioContext.createGain()

        // 设置频率为800Hz（预警音调，比报警稍低）
        alarmState.value.warningOscillator.frequency.setValueAtTime(800, alarmState.value.warningAudioContext.currentTime)
        alarmState.value.warningOscillator.type = 'square' // 方波，更像蜂鸣器

        // 设置音量（≥80dB相当于 0.8）
        alarmState.value.warningGainNode.gain.setValueAtTime(0.8, alarmState.value.warningAudioContext.currentTime)

        // 连接音频节点
        alarmState.value.warningOscillator.connect(alarmState.value.warningGainNode)
        alarmState.value.warningGainNode.connect(alarmState.value.warningAudioContext.destination)

        // 开始播放
        alarmState.value.warningOscillator.start()

        console.log('预警蜂鸣器已启动')
    } catch (error) {
        console.error('创建预警蜂鸣器声音失败:', error)
    }
}

// 停止蜂鸣器
const stopBeepSound = () => {
    try {
        if (alarmState.value.oscillator) {
            alarmState.value.oscillator.stop()
            alarmState.value.oscillator.disconnect()
            alarmState.value.oscillator = null
        }
        if (alarmState.value.gainNode) {
            alarmState.value.gainNode.disconnect()
            alarmState.value.gainNode = null
        }
        if (alarmState.value.audioContext) {
            alarmState.value.audioContext.close()
            alarmState.value.audioContext = null
        }
        console.log('蜂鸣器报警已停止')
    } catch (error) {
        console.error('停止蜂鸣器声音失败:', error)
    }
}

// 停止预警蜂鸣器
const stopWarningBeepSound = () => {
    try {
        if (alarmState.value.warningOscillator) {
            alarmState.value.warningOscillator.stop()
            alarmState.value.warningOscillator.disconnect()
            alarmState.value.warningOscillator = null
        }
        if (alarmState.value.warningGainNode) {
            alarmState.value.warningGainNode.disconnect()
            alarmState.value.warningGainNode = null
        }
        if (alarmState.value.warningAudioContext) {
            alarmState.value.warningAudioContext.close()
            alarmState.value.warningAudioContext = null
        }
        console.log('预警蜂鸣器已停止')
    } catch (error) {
        console.error('停止预警蜂鸣器声音失败:', error)
    }
}

// 启动报警（闪烁+蜂鸣器）
const startAlarm = () => {
    if (alarmState.value.isAlarming) return

    console.log('启动报警模式')
    alarmState.value.isAlarming = true

    // 启动蜂鸣器
    createBeepSound()

    // 启动闪烁效果
    alarmState.value.flashTimer = setInterval(() => {
        // 检查组件是否已卸载
        if (isUnmounted.value) {
            clearInterval(alarmState.value.flashTimer)
            return
        }
        const monitorAreas = document.querySelectorAll('.monitor-area')
        monitorAreas.forEach(area => {
            if (area) {
                area.classList.toggle('alarm-flash')
            }
        })
    }, 500) // 每500ms闪烁一次

    // 10秒后自动停止报警
    alarmState.value.alarmTimer = setTimeout(() => {
        stopAlarm()
    }, 10000)
}

// 启动预警（黄灯闪烁+蜂鸣器）
const startWarning = () => {
    if (alarmState.value.isWarning) return

    console.log('启动预警模式')
    alarmState.value.isWarning = true

    // 启动预警蜂鸣器
    createWarningBeepSound()

    // 启动黄灯闪烁效果
    alarmState.value.warningFlashTimer = setInterval(() => {
        // 检查组件是否已卸载
        if (isUnmounted.value) {
            clearInterval(alarmState.value.warningFlashTimer)
            return
        }
        const monitorAreas = document.querySelectorAll('.monitor-area')
        monitorAreas.forEach(area => {
            if (area) {
                area.classList.toggle('warning-flash')
            }
        })
    }, 500) // 每500ms闪烁一次

    // 10秒后自动停止预警
    alarmState.value.warningTimer = setTimeout(() => {
        stopWarning()
    }, 10000)
}

// 停止报警
const stopAlarm = () => {
    if (!alarmState.value.isAlarming) return

    console.log('停止报警模式')
    alarmState.value.isAlarming = false

    // 停止蜂鸣器
    stopBeepSound()

    // 停止闪烁效果
    if (alarmState.value.flashTimer) {
        clearInterval(alarmState.value.flashTimer)
        alarmState.value.flashTimer = null
    }

    // 清除定时器
    if (alarmState.value.alarmTimer) {
        clearTimeout(alarmState.value.alarmTimer)
        alarmState.value.alarmTimer = null
    }

    // 移除闪烁样式
    if (!isUnmounted.value) {
        const monitorAreas = document.querySelectorAll('.monitor-area')
        monitorAreas.forEach(area => {
            if (area) {
                area.classList.remove('alarm-flash')
            }
        })
    }
}

// 停止预警
const stopWarning = () => {
    if (!alarmState.value.isWarning) return

    console.log('停止预警模式')
    alarmState.value.isWarning = false

    // 停止预警蜂鸣器
    stopWarningBeepSound()

    // 停止闪烁效果
    if (alarmState.value.warningFlashTimer) {
        clearInterval(alarmState.value.warningFlashTimer)
        alarmState.value.warningFlashTimer = null
    }

    // 清除定时器
    if (alarmState.value.warningTimer) {
        clearTimeout(alarmState.value.warningTimer)
        alarmState.value.warningTimer = null
    }

    // 移除所有预警闪烁样式
    if (!isUnmounted.value) {
        const monitorAreas = document.querySelectorAll('.monitor-area')
        monitorAreas.forEach(area => {
            if (area) {
                area.classList.remove('warning-flash')
            }
        })
    }
}

// 检查设备状态是否有ALARM
const checkAlarmStatus = () => {
    // 检查组件是否已卸载
    if (isUnmounted.value) {
        console.warn('组件已卸载，跳过报警状态检查')
        return
    }

    console.log('检查报警状态...')

    // 检查deviceStore是否有效
    if (!deviceStore) {
        console.warn('deviceStore无效，跳过报警状态检查')
        return
    }

    console.log('设备数据:', deviceStore.devices)
    console.log('告警数据:', deviceStore.alarms)

    try {
        // 只检查device数组中的状态
        const hasDeviceAlarm = Array.isArray(deviceStore.devices) ?
            deviceStore.devices.some(device => device?.currentStatus === 'ALARM') : false

        const hasDeviceWarning = Array.isArray(deviceStore.devices) ?
            deviceStore.devices.some(device => device?.currentStatus === 'WARNING') : false

        console.log('设备ALARM状态:', hasDeviceAlarm)
        console.log('设备WARNING状态:', hasDeviceWarning)
        console.log('当前是否正在报警:', alarmState.value?.isAlarming)
        console.log('当前是否正在预警:', alarmState.value?.isWarning)

        // 处理ALARM状态（优先级最高）
        if (hasDeviceAlarm && !alarmState.value?.isAlarming) {
            console.log('触发设备报警！')
            // 如果正在预警，先停止预警
            if (alarmState.value?.isWarning) {
                stopWarning()
            }
            startAlarm()
        } else if (!hasDeviceAlarm && alarmState.value?.isAlarming) {
            console.log('停止设备报警！')
            stopAlarm()
        }

        // 处理WARNING状态（只有在没有ALARM时才处理）
        if (!hasDeviceAlarm) {
            if (hasDeviceWarning && !alarmState.value?.isWarning) {
                console.log('触发设备预警！')
                startWarning()
            } else if (!hasDeviceWarning && alarmState.value?.isWarning) {
                console.log('停止设备预警！')
                stopWarning()
            }
        }
    } catch (error) {
        console.warn('检查报警状态时发生错误:', error)
    }
}





// 设备图标映射
const deviceIconMap = {
    'waterHose1': shuidaiImg,
    'waterHose2': shuidaiImg,
    'waterGun1': shuiqiangImg,
    'waterGun2': shuiqiangImg,
    'fireExtinguisher1': miehuoImg,
    'fireExtinguisher2': miehuoImg,
    'fireExtinguisher3': miehuoImg,
    'foamGun': shuiqiangImg,
    'boxDoor': menImg,
    'liquidLevel': paomoImg,
    'waterPressure': shuiyajiancheImg
}

// 状态映射
const getDeviceStatus = (currentStatus, deviceName) => {
    // 根据设备名称确定设备类型
    const isWaterHose = deviceName.includes('消防水带')
    const isFireExtinguisher = deviceName.includes('灭火器')
    const isFoamGun = deviceName.includes('泡沫喷枪')
    const isBoxDoor = deviceName.includes('箱体门')
    const isFoamLevel = deviceName.includes('泡沫液位')
    const isWaterPressure = deviceName.includes('水压监测')
    const isWaterGun = deviceName.includes('消防水枪')

    // 箱体门的状态映射
    if (isBoxDoor) {
        switch (currentStatus) {
            case 'NORMAL':
                return { status: 'online', statusText: '关闭' }
            case 'IN_USE':
            case 'WARNING':
            case 'ALARM':
                return { status: 'maintenance', statusText: '敞开' }
            default:
                return { status: 'online', statusText: '关闭' }
        }
    }

    // 泡沫灭火剂（泡沫液位）的状态映射
    if (isFoamLevel) {
        switch (currentStatus) {
            case 'NORMAL':
            case 'IN_USE':
                return { status: 'online', statusText: '高液位' }
            case 'WARNING':
                return { status: 'maintenance', statusText: '中液位' }
            case 'ALARM':
                return { status: 'fault', statusText: '低液位' }
            default:
                return { status: 'online', statusText: '高液位' }
        }
    }

    // 灭火器、消防水枪、消防水带的状态映射
    if (isFireExtinguisher || isWaterGun || isWaterHose) {
        switch (currentStatus) {
            case 'NORMAL':
                return { status: 'online', statusText: '在位' }
            case 'IN_USE':
            case 'WARNING':
                return { status: 'maintenance', statusText: '离位' }
            case 'ALARM':
                return { status: 'fault', statusText: '缺失' }
            default:
                return { status: 'online', statusText: '在位' }
        }
    }

    // 泡沫喷枪的状态映射
    if (isFoamGun) {
        switch (currentStatus) {
            case 'NORMAL':
                return { status: 'online', statusText: '关闭' }
            case 'IN_USE':
            case 'WARNING':
            case 'ALARM':
                return { status: 'maintenance', statusText: '开' }
            default:
                return { status: 'online', statusText: '关闭' }
        }
    }

    // 水压检测的状态映射
    if (isWaterPressure) {
        switch (currentStatus) {
            case 'NORMAL':
            case 'IN_USE':
                return { status: 'online', statusText: '较高' }
            case 'WARNING':
            case 'ALARM':
                return { status: 'maintenance', statusText: '较低' }
            default:
                return { status: 'online', statusText: '较高' }
        }
    }

    // 默认状态映射（兼容旧逻辑）
    switch (currentStatus) {
        case 'NORMAL':
            return { status: 'online', statusText: '在位' }
        case 'WARNING':
            return { status: 'maintenance', statusText: '移走' }
        case 'ERROR':
            return { status: 'fault', statusText: '故障' }
        case 'OFFLINE':
            return { status: 'fault', statusText: '离线' }
        default:
            return { status: 'online', statusText: '在位' }
    }
}

// 设备分组逻辑 - 将设备按照2个一组进行分组
const deviceGroups = ref([])

// 确保deviceGroups始终是有效数组的安全getter
const safeDeviceGroups = computed(() => {
    // 检查组件是否已卸载
    if (isUnmounted.value) {
        return []
    }
    // 检查deviceGroups是否有效
    if (!deviceGroups || !deviceGroups.value || !Array.isArray(deviceGroups.value)) {
        return []
    }

    // 确保每个group和device都有完整的属性结构
    return deviceGroups.value.map((group, groupIndex) => {
        if (!group || typeof group !== 'object') {
            return {
                id: groupIndex + 1,
                devices: []
            }
        }

        return {
            id: group.id || (groupIndex + 1),
            devices: Array.isArray(group.devices) ? group.devices.map((device, deviceIndex) => {
                if (!device || typeof device !== 'object') {
                    return {
                        id: `device-${groupIndex}-${deviceIndex}`,
                        name: '',
                        icon: '',
                        status: 'online',
                        statusText: '',
                        lastStatusChangeTime: null
                    }
                }

                return {
                    id: device.id || `device-${groupIndex}-${deviceIndex}`,
                    name: device.name || '',
                    icon: device.icon || '',
                    status: device.status || 'online',
                    statusText: device.statusText || '',
                    lastStatusChangeTime: device.lastStatusChangeTime || null
                }
            }) : []
        }
    })
})

// 更新设备分组
const updateDeviceGroups = () => {
    // 检查组件是否已卸载
    if (isUnmounted.value) {
        console.warn('组件已卸载，跳过设备分组更新')
        return
    }

    // 检查deviceStore和devices是否有效
    if (!deviceStore || !deviceStore.devices || !Array.isArray(deviceStore.devices)) {
        console.warn('deviceStore或devices无效，跳过设备分组更新')
        return
    }

    try {
        const devices = deviceStore.devices.map(device => {
            if (!device) return null
            const statusInfo = getDeviceStatus(device.currentStatus, device.name)
            
            // 处理设备图标 - 优先使用API返回的icon字段
            let deviceIcon = miehuoImg // 默认图标
            if (device.icon) {
                // 如果API返回了icon字段，优先使用
                if (process.env.NODE_ENV === 'development') {
                    // 开发环境：使用test.junhekh.cn:8061拼接完整路径
                    deviceIcon = device.icon.startsWith('http') ? device.icon : `http://test.junhekh.cn:8061${device.icon}`
                } else {
                    // 生产环境：使用127.0.0.1拼接完整路径
                    deviceIcon = device.icon.startsWith('http') ? device.icon : `http://127.0.0.1${device.icon}`
                }
            } else {
                // 如果API没有返回icon字段，使用代码中定义的映射
                deviceIcon = deviceIconMap[device.id] || miehuoImg
            }
            
            return {
                id: device.id,
                name: device.name || '',
                icon: deviceIcon,
                status: statusInfo?.status || 'online',
                statusText: statusInfo?.statusText || '在位',
                lastStatusChangeTime: device.lastStatusChangeTime
            }
        }).filter(device => device !== null)

        // 按照2个设备一组进行分组
        const groups = []
        for (let i = 0; i < devices.length; i += 2) {
            groups.push({
                id: Math.floor(i / 2) + 1,
                devices: devices.slice(i, i + 2)
            })
        }

        // 安全地更新deviceGroups
        if (!isUnmounted.value && deviceGroups && deviceGroups.value !== undefined) {
            deviceGroups.value = groups
        }
    } catch (error) {
        console.warn('更新设备分组时发生错误:', error)
    }
}

// 告警数据 - 使用计算属性从deviceStore获取
const alarmData = computed(() => {
    // 检查组件是否已卸载
    if (isUnmounted.value) {
        return []
    }
    // 检查deviceStore和alarms是否有效
    if (!deviceStore || !deviceStore.alarms || !Array.isArray(deviceStore.alarms)) {
        return []
    }
    return deviceStore.alarms.map((alarm, index) => ({
        id: (index + 1).toString().padStart(2, '0'), // 序号从1开始，补零
        name: alarm?.name || '',
        status: getAlarmStatusText(alarm?.status, alarm?.name),
        productTime: formatDateTime(alarm?.since),
        endTime: alarm?.endTime ? formatDateTime(alarm.endTime) : ''
    }))
})

// 告警状态映射函数
const getAlarmStatusText = (currentStatus, deviceName) => {
    // 根据设备名称确定设备类型
    const isWaterHose = deviceName.includes('消防水带')
    const isFireExtinguisher = deviceName.includes('灭火器')
    const isFoamGun = deviceName.includes('泡沫喷枪')
    const isBoxDoor = deviceName.includes('箱体门')
    const isFoamLevel = deviceName.includes('泡沫液位')
    const isWaterPressure = deviceName.includes('水压监测')
    const isWaterGun = deviceName.includes('消防水枪')

    // 箱体门的状态映射
    if (isBoxDoor) {
        switch (currentStatus) {
            case 'NORMAL':
                return '关闭'
            case 'IN_USE':
            case 'WARNING':
            case 'ALARM':
                return '敞开'
            default:
                return '关闭'
        }
    }

    // 泡沫灭火剂（泡沫液位）的状态映射
    if (isFoamLevel) {
        switch (currentStatus) {
            case 'NORMAL':
            case 'IN_USE':
                return '高液位'
            case 'WARNING':
                return '中液位'
            case 'ALARM':
                return '低液位'
            default:
                return '高液位'
        }
    }

    // 灭火器、消防水枪、消防水带的状态映射
    if (isFireExtinguisher || isWaterGun || isWaterHose) {
        switch (currentStatus) {
            case 'NORMAL':
                return '在位'
            case 'IN_USE':
            case 'WARNING':
                return '离位'
            case 'ALARM':
                return '缺失'
            default:
                return '在位'
        }
    }

    // 泡沫喷枪的状态映射
    if (isFoamGun) {
        switch (currentStatus) {
            case 'NORMAL':
                return '关闭'
            case 'IN_USE':
            case 'WARNING':
            case 'ALARM':
                return '开'
            default:
                return '关闭'
        }
    }

    // 水压检测的状态映射
    if (isWaterPressure) {
        switch (currentStatus) {
            case 'NORMAL':
            case 'IN_USE':
                return '较高'
            case 'WARNING':
            case 'ALARM':
                return '较低'
            default:
                return '较高'
        }
    }

    // 默认状态映射（移除其他状态）
    return '正常'
}

// 时间格式化函数
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return ''
    const date = new Date(dateTimeString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
}



// 更新时间
const updateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    currentTime.value = `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`
}

// 定时器
let timer = null
let startupTimer = null
let storeUnsubscribe = null

// 事件处理函数
const handleSettings = () => {
    loginForm.value.action = 'settings'
    loginForm.value.username = ''
    loginForm.value.password = ''
    showLoginDialog.value = true
}

const handleExit = () => {
    loginForm.value.action = 'exit'
    loginForm.value.username = ''
    loginForm.value.password = ''
    showLoginDialog.value = true
}

// 清空登录表单
const clearLoginForm = () => {
    loginForm.value.username = ''
    loginForm.value.password = ''
    loginForm.value.action = 'settings'
}

// 清空设备参数表单
const clearSettingsForm = () => {
    settingsForm.value = {
        stationNumber: '',
        waterPressureThreshold: '',
        highLiquidLevelThreshold: '',
        midLiquidLevelThreshold: '',
        lowLiquidLevelThreshold: '',
        warningTimeThreshold: '',
        time: '',
        name: '',
        registerAddress: '',
        deviceName: '',
        uploadedImage: '',
        uploadedImageUrl: ''
    }
    // 清空完整路径
    fullImagePath.value = ''
}

// 验证数字输入（允许小数，禁止汉字）
const validateNumberInput = (field, value) => {
    // 移除所有非数字和小数点的字符
    const cleanValue = value.replace(/[^\d.]/g, '')
    // 确保只有一个小数点
    const parts = cleanValue.split('.')
    let finalValue = parts[0]
    if (parts.length > 1) {
        finalValue += '.' + parts.slice(1).join('')
    }
    settingsForm.value[field] = finalValue
}

// 验证字符串输入（禁止特殊字符，允许中英文数字）
const validateStringInput = (field, value) => {
    // 允许中文、英文、数字、空格、下划线、连字符
    const cleanValue = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s_-]/g, '')
    settingsForm.value[field] = cleanValue
}

// 上传图片前的验证
const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/')
    const isLt2M = file.size / 1024 / 1024 < 2

    if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
    }
    if (!isLt2M) {
        ElMessage.error('上传图片大小不能超过 2MB!')
        return false
    }
    return true
}

// 上传成功回调
const handleUploadSuccess = (response, file) => {
    console.log('上传成功:', response)
    if (response && response.path) {
        // 保存原始路径
        settingsForm.value.uploadedImage = response.path
        // 根据环境处理图片显示路径
        if (process.env.NODE_ENV === 'development') {
            // 开发环境：使用test.junhekh.cn:8061拼接完整的服务器地址
            settingsForm.value.uploadedImageUrl = response.path.startsWith('http') ? 
                response.path : `http://test.junhekh.cn:8061${response.path}`
        } else {
            // 生产环境：使用127.0.0.1拼接完整的服务器地址
            settingsForm.value.uploadedImageUrl = response.path.startsWith('http') ? 
                response.path : `http://127.0.0.1${response.path}`
        }
        // 拼接完整路径用于接口传参
        fullImagePath.value = `${API_CONFIG.BASE_URL}${response.path}`
    } else {
        // 如果没有返回path，使用本地预览
        settingsForm.value.uploadedImage = file.name
        settingsForm.value.uploadedImageUrl = URL.createObjectURL(file.raw)
        fullImagePath.value = ''
    }
    ElMessage.success('图片上传成功!')
}

// 上传失败回调
const handleUploadError = (error) => {
    console.error('上传失败:', error)
    ElMessage.error('图片上传失败!')
}



// 关闭对话框
const closeDialog = () => {
    showLoginDialog.value = false
}

// 确认登录
const handleConfirm = async () => {
    console.log('登录信息:', loginForm.value)

    // 验证账号密码
    const isValid = await verifyPassword(loginForm.value.username, loginForm.value.password)

    if (!isValid) {
        ElMessage.error('账号或密码错误，请重新输入')
        return
    }

    showLoginDialog.value = false

    // 判断是设置还是退出操作
    if (loginForm.value.action === 'exit') {
        // 退出操作
        if (window.electronAPI && window.electronAPI.exitApp) {
            window.electronAPI.exitApp()
        } else {
            window.close()
        }
    } else {
        // 设置操作 - 打开设备参数设置弹窗前先获取数据
        await Promise.all([fetchThresholds(), fetchStationNumber(), fetchCustomDeviceInfo()])
        showSettingsDialog.value = true
    }
}

const captureLeft = async () => {
    try {
        // 检查组件是否已卸载
        if (isUnmounted.value) {
            console.warn('组件已卸载，跳过左侧截图')
            return
        }
        const element = document.querySelector('.monitor-area:first-child .monitor-content')
        if (element) {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0F1B39',
                scale: 1
            })

            const dataURL = canvas.toDataURL('image/png')
            const defaultName = `监控区域1_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`

            // 使用Electron IPC保存截图
            if (window.electronAPI && window.electronAPI.saveScreenshot) {
                const result = await window.electronAPI.saveScreenshot(dataURL, defaultName)
                if (result.success) {
                    console.log('截图保存成功:', result.filePath)
                } else {
                    console.error('截图保存失败:', result.message)
                }
            } else {
                // 如果不在Electron环境中，使用浏览器下载作为备用
                const link = document.createElement('a')
                link.download = defaultName
                link.href = dataURL
                link.click()
            }
        }
    } catch (error) {
        console.error('截图失败:', error)
    }
}

const captureRight = async () => {
    try {
        // 检查组件是否已卸载
        if (isUnmounted.value) {
            console.warn('组件已卸载，跳过右侧截图')
            return
        }
        const element = document.querySelector('.monitor-area:last-child .monitor-content')
        if (element) {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0F1B39',
                scale: 1
            })

            const dataURL = canvas.toDataURL('image/png')
            const defaultName = `监控区域2_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`

            // 使用Electron IPC保存截图
            if (window.electronAPI && window.electronAPI.saveScreenshot) {
                const result = await window.electronAPI.saveScreenshot(dataURL, defaultName)
                if (result.success) {
                    console.log('截图保存成功:', result.filePath)
                } else {
                    console.error('截图保存失败:', result.message)
                }
            } else {
                // 如果不在Electron环境中，使用浏览器下载作为备用
                const link = document.createElement('a')
                link.download = defaultName
                link.href = dataURL
                link.click()
            }
        }
    } catch (error) {
        console.error('截图失败:', error)
    }
}

onMounted(async () => {
    updateTime()
    timer = setInterval(updateTime, 1000)

    // 启动设备状态轮询
    deviceStore.startPolling()

    // 监听设备数据变化，更新界面
    storeUnsubscribe = deviceStore.$subscribe(() => {
        updateDeviceGroups()
        // 检查报警状态
        checkAlarmStatus()
    })

    // 初始化数据
    updateDeviceGroups()

    // 获取设备参数数据，包括设备名称
    await Promise.all([fetchThresholds(), fetchStationNumber()])

    // 初始检查报警状态
    checkAlarmStatus()

    // 确保DOM完全渲染后再启动视频流
    await nextTick()
    // 添加更长的延迟确保DOM元素完全准备好和稳定
    startupTimer = setTimeout(async () => {
        if (isUnmounted.value) {
            console.log('组件已卸载，跳过视频流启动')
            return
        }
        try {
            console.log('开始启动视频流，DOM应该已经完全准备好')
            await startAllVideoStreams()
        } catch (error) {
            console.error('启动视频流失败:', error)
        }
    }, 500)
})

onUnmounted(async () => {
    // 立即设置卸载标志，防止后续异步操作访问响应式对象
    isUnmounted.value = true

    if (timer) {
        clearInterval(timer)
    }
    if (startupTimer) {
        clearTimeout(startupTimer)
    }

    // 取消deviceStore订阅，防止组件卸载后仍触发回调
    if (storeUnsubscribe) {
        storeUnsubscribe()
        storeUnsubscribe = null
    }

    // 停止设备状态轮询
    deviceStore.stopPolling()

    // 安全地清理HLS实例和视频元素
    try {
        if (videoStreams.value && videoStreams.value.left && videoStreams.value.left.hlsInstance) {
            videoStreams.value.left.hlsInstance.destroy()
            videoStreams.value.left.hlsInstance = null
        }
        if (videoStreams.value && videoStreams.value.right && videoStreams.value.right.hlsInstance) {
            videoStreams.value.right.hlsInstance.destroy()
            videoStreams.value.right.hlsInstance = null
        }

        // 清理视频元素
        ['left', 'right'].forEach(position => {
            try {
                const containerElement = document.querySelector(`#monitor-${position}`)
                if (containerElement) {
                    const videoElement = containerElement.querySelector('video')
                    if (videoElement) {
                        videoElement.pause()
                        videoElement.src = ''
                        videoElement.load()
                    }
                }
            } catch (domError) {
                console.warn(`清理${position}视频元素时发生错误:`, domError)
            }
        })

        // 停止所有视频流
        await stopAllVideoStreams()
        // 确保videoStreamManager也停止所有流
        await videoStreamManager.stopAllStreams()
    } catch (error) {
        console.warn('清理视频流资源时发生错误:', error)
    }

    // 清理报警状态
    stopAlarm()

    // 彻底断开响应式连接，防止模板访问null对象
    try {
        videoStreams.value = null
    } catch (error) {
        console.warn('清理响应式对象时发生错误:', error)
    }
})
</script>

<style lang="scss" scoped>
.home {
    width: 1024px;
    height: 600px;
    background: #0F1B39;
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    overflow: hidden;
    position: relative;
    font-family: 'Source Han Sans CN', sans-serif;
}

/* 头部区域 */
.header {
    width: 1024px;
    height: 44px;
    background: url('/static/index/head.png') no-repeat center;
    background-size: 1024px 44px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .datetime {
        position: absolute;
        left: 16px;
        top: 8px;
        color: #E3EAFF;
        font-size: 12px;
        font-family: 'Source Han Sans CN', sans-serif;
    }

    .title {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: #E3EAFF;
        font-size: 26px;
        font-weight: bold;
        font-family: YouSheBiaoTiHei, YouSheBiaoTiHei;
    }

    .controls {
        position: absolute;
        right: 16px;
        top: 8px;
        display: flex;
        gap: 18px;

        .control-item {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            color: #9AB5D6;
            font-family: 'Source Han Sans CN', sans-serif;
            font-size: 9px;

            .control-icon {
                width: 14px;
                height: 14px;
            }
        }
    }
}

/* 中间监控区域 */
.monitor-section {
    flex: 1;
    margin: 16px;
    display: flex;
    justify-content: center;
    align-items: center;

    .monitor-container {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        gap: 16px;

        .monitor-area {
            // flex: 1;
            width: 488px;
            height: 279px;
            border: 2px solid #32A4F1;
            position: relative;
            background: #000;
            transition: border-color 0.3s ease;

            &.alarm-flash {
                border-color: #ff0000 !important;
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
            }

            &.warning-flash {
                border-color: #ffaa00 !important;
                box-shadow: 0 0 20px rgba(255, 170, 0, 0.8);
            }

            .screenshot-btn {
                position: absolute;
                top: 19px;
                left: 19px;
                cursor: pointer;
                z-index: 10;

                .screenshot-icon {
                    width: 20px;
                    height: 20px;
                }
            }

            .monitor-content {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;

                .monitor-placeholder {
                    color: #666;
                    font-size: 16px;
                }
            }
        }
    }
}

.hikvision-player {
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    position: relative;
}

.connection-status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10;
}

.error-message {
    color: #f56c6c;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.error-message i {
    font-size: 24px;
}

.connecting-message {
    color: #409eff;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.connecting-message i {
    font-size: 24px;
    animation: rotate 2s linear infinite;
}

.connected-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    color: #67c23a;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    background: rgba(0, 0, 0, 0.7);
    padding: 5px 10px;
    border-radius: 4px;
}

.retry-btn {
    background: #409eff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.retry-btn:hover {
    background: #66b1ff;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes slideText {
    0% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(0);
    }

    50% {
        transform: translateX(124px);
    }

    75% {
        transform: translateX(124px);
    }

    100% {
        transform: translateX(0);
    }
}

/* 底部区域 */
.bottom-section {
    padding: 16px;
    display: flex;
    gap: 16px;

    /* 左侧设备状态 */
    .device-status {
        flex: 1;

        .status-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            color: #E3EAFF;
            font-size: 12px;

            .status-icon {
                width: 16px;
                height: 16px;
            }
        }



        .device-grid {
            // grid-template-columns: repeat(3, 1fr);
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .device-group {
                width: 157px;
                height: 85px;
                display: flex;
                flex-direction: column;
                align-items: center;
                // justify-content: center;
                // gap: 4px;
                // padding: 8px;
                // background: rgba(255, 255, 255, 0.05);
                padding-top: 8px;
                background-color: #0F2D54;
                border: 1px solid rgba(50, 164, 241, 0.21);

                .device-item {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    width: 157px;
                    padding: 4px;
                    border-radius: 2px;
                    min-height: 35px;

                    .my {
                        display: flex;
                        align-items: center;
                        margin-left: 11px;
                    }

                    .device-icon {
                        width: 20px;
                        height: 20px;
                        margin-right: 6px;
                        flex-shrink: 0;
                    }

                    .device-name {
                        color: #E3EAFF;
                        font-size: 9px;
                        margin-right: 4px;
                    }

                    .device-status-text {
                        font-size: 8px;
                        margin-right: 12px;
                        width: 48px;
                        height: 20px;
                    }

                    &.online .device-status-text {
                        width: 48px;
                        height: 20px;
                        color: #52FF9A;
                        background: url('/static/index/zaiwei.png') no-repeat center;
                        background-size: 48px 20px;
                        text-align: center;
                        font-size: 8px;
                        line-height: 20px;
                    }

                    &.maintenance .device-status-text {
                        width: 48px;
                        height: 20px;
                        color: #FFC354;
                        background: url('/static/index/changkai.png') no-repeat center;
                        background-size: 48px 20px;
                        text-align: center;
                        font-size: 8px;
                        line-height: 20px;
                    }

                    &.warning .device-status-text,
                    &.fault .device-status-text {
                        width: 48px;
                        height: 20px;
                        color: #FF3C10;
                        background: url('/static/index/baojing.png') no-repeat center;
                        background-size: 48px 20px;
                        text-align: center;
                        font-size: 8px;
                        line-height: 20px;
                    }
                }
            }
        }
    }

    /* 右侧告警列表 */
    .alarm-section {
        flex: 1;
        background: #0F2D54;
        // border: 1px solid #32A4F1;
        // border-radius: 4px;
        // padding: 12px;

        .alarm-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            color: #E3EAFF;
            font-size: 12px;

            .alarm-icon {
                width: 16px;
                height: 16px;
            }
        }


    }
}

/* Element Plus 表格样式覆盖 */
:deep(.el-table) {
    background: transparent;
    color: #fff;
    font-size: 12px;
    --el-table-border-color: none !important;
}

:deep(.el-table th.el-table__cell) {
    background: #1C5082 !important;
    color: #fff !important;
    border-bottom: 1px solid #32A4F1;
    font-size: 12px !important;
    padding: 4px 0;
}

:deep(.el-table td.el-table__cell) {
    background: #0F2D54 !important;
    color: #fff !important;
    border-bottom: 1px solid rgba(50, 164, 241, 0.3);
    font-size: 12px !important;
    padding: 2px 0;
}

:deep(.el-table--border) {
    border: 1px solid #32A4F1;
}

:deep(.el-table--border::after) {
    background: #32A4F1;
}

:deep(.el-table::before) {
    background: #32A4F1;
}

:deep(.el-table .el-table__border-left-patch) {
    background: #32A4F1;
}

:deep(.el-table .el-table__border-bottom-patch) {
    background: #32A4F1;
}


.sehbeihao {
    display: flex;
    justify-content: space-between;
    margin: 0 16px;

    .left-item {
        width: 488px;
        height: 28px;
        background: url('/static/index/gaojing.png') no-repeat center;
        background-size: 100% 28px;
        display: flex;
        align-items: center;
        font-size: 12px;

        .status-title {
            color: #fff;
            font-weight: bold;
            font-family: 'Source Han Sans CN', sans-serif;
            margin-left: 36px;
        }

        .status-subtitle {
            width: 308px;
            color: #FF3C10;
            margin-left: 28px;
            font-weight: 500;
            font-size: 14px;
            font-family: 'Source Han Sans CN', sans-serif;
            overflow: hidden;
            white-space: nowrap;
            position: relative;
            animation: slideText 9s ease-in-out infinite;
        }
    }

    .right-item {
        width: 488px;
        height: 28px;
        padding-right: 11px;
        background: url('/static/index/gaojing.png') no-repeat center;
        background-size: 100% 28px;
        display: flex;
        align-items: center;
        font-size: 12px;

        .alarm-title {
            color: #FFFFFF;
            font-weight: bold;
            margin-left: 36px;
        }

        .alarm-subtitle {
            cursor: pointer;
            color: #9AB5D6;
            margin-left: auto;
        }
    }
}

:deep(.el-overlay-dialog) {
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 100% !important;
    height: 100% !important;
    background-color: rgba(0, 0, 0, 0.5) !important;
    z-index: 9997 !important;
}

:deep(.login-dialog) {
    position: relative !important;
    width: 293px !important;
    height: 208px !important;
    background: rgba(3, 69, 119, 0.89) !important;
    border-radius: 0 !important;
    margin: 0 auto !important;
    margin-top: 196px !important;
    z-index: 9999 !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
}

:deep(.login-dialog .el-dialog__header) {
    display: none !important;
}

:deep(.login-dialog .el-dialog__body) {
    padding: 0 !important;
    height: 208px !important;
    width: 293px !important;
    margin: 0 !important;

}

.login-content {
    width: 100%;
    height: 208px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    // padding: 20px;
    box-sizing: border-box;

    .input-section {
        display: flex;
        flex-direction: column;
        gap: 14px;

        .input-group {
            display: flex;
            align-items: center;

            &.account-input {
                margin-bottom: 14px;
            }

            .input-icon {
                width: 34px;
                height: 29px;
                background: #0A56C2;
                display: flex;
                align-items: center;
                justify-content: center;

                img {
                    width: 15px;
                    height: 15px;
                }
            }

            .input-field {
                background: #034577;
                border: 1px solid #2175EB;
                border-left: none;
                color: #fff;
                padding: 6px 12px;
                outline: none;
                font-size: 12px;
                width: 150px;
                height: 29px;
                box-sizing: border-box;

                &::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }
            }
        }
    }

    .button-section {
        width: 88px;
        height: 26px;
        background: #1C5082;
        border-radius: 2px;
        color: #fff;
        font-size: 12px;
        cursor: pointer;
        line-height: 26px;
        text-align: center;
    }
}

/* 设备参数设置弹窗样式 */
:deep(.settings-dialog) {
    position: relative !important;
    width: 401px !important;
    height: 500px !important;
    background: rgba(3, 69, 119, 0.89) !important;
    border-radius: 0 !important;
    margin: 0 auto !important;
    margin-top: 50px !important;
    z-index: 9999 !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    opacity: 0.89;

    .el-dialog__header {
        display: none !important;
    }

    .el-dialog__body {
        padding: 0 !important;
        height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
    }
}

.settings-container {
    display: flex;
    flex-direction: column;
    height: 500px;
    width: 100%;
}

.settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(154, 181, 214, 0.5);
        border-radius: 3px;

        &:hover {
            background: rgba(154, 181, 214, 0.8);
        }
    }
}

.settings-footer {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid rgba(154, 181, 214, 0.2);
    background: rgba(3, 69, 119, 0.95);
}

.settings-form {

    // margin-top: 20px;
    .tishi {
        color: #9AB5D6;
        width: 193px;
        margin-left: 130px;
        font-size: 12px;
    }

    .form-item {
        display: flex;
        align-items: center;
        margin-bottom: 14px;

        .form-label {
            width: 120px;
            color: #9AB5D6;
            font-size: 12px;
            text-align: right;
            margin-right: 10px;
        }

        .form-input {
            width: 193px;
            border: none !important;
            box-shadow: none !important;

            :deep(.el-input__wrapper) {
                height: 29px;
                background: rgba(0, 0, 0, 0.24);
                border: none !important;
                box-shadow: none !important;
                border: 1px solid #2175EB !important;
                border-radius: 4px;

                .el-input__inner {
                    color: #9AB5D6;
                    font-size: 12px;
                    background: transparent;
                    border: none;

                    &::placeholder {
                        color: #9AB5D6;
                    }
                }
            }
        }

        .form-unit {
            margin-left: 4px;
            color: #9AB5D6;
            font-size: 12px;
        }

        .upload-demo {
            width: 193px;

            .upload-button {
                width: 80px;
                height: 80px;
                background: rgba(0, 0, 0, 0.24);
                border: 1px solid #2175EB;
                border-radius: 4px;
                color: #9AB5D6;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s;

                &:hover {
                    background: rgba(33, 117, 235, 0.1);
                    border-color: #4A90E2;
                }
            }

            .uploaded-image-preview {
                width: 80px;
                height: 80px;
                position: relative;
                border: 1px solid #2175EB;
                border-radius: 4px;
                overflow: hidden;
                cursor: pointer;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;

                    span {
                        color: #9AB5D6;
                        font-size: 10px;
                    }
                }

                &:hover .image-overlay {
                    opacity: 1;
                }
            }
        }

        .uploaded-image-name {
            margin-top: 5px;
            color: #9AB5D6;
            font-size: 10px;
            opacity: 0.8;
        }
    }
}

:deep(.confirm-btn) {
    width: 88px;
    height: 26px;
    background: #1C5082;
    color: #fff;
    font-size: 12px;
    border-radius: 2px;
    text-align: center;
    line-height: 26px;
    margin: 0 auto;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
        background: #1a5fb8;
    }
}
</style>