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
                            <video v-if="safeVideoStreams.left.active" key="left-video" autoplay playsinline
                                style="width: 484px; height: 275px; object-fit: cover;"
                                :src="safeVideoStreams.left.isPlayingVideo ? safeVideoStreams.left.videoUrl : undefined"
                                :volume="1.0" @error="handleVideoError('left', $event)"></video>
                            <div v-else-if="safeVideoStreams.left.loading" key="left-loading"
                                class="monitor-placeholder">
                                正在连接摄像头...</div>
                            <div v-else-if="safeVideoStreams.left.error" key="left-error" class="monitor-placeholder">
                                连接失败: {{ safeVideoStreams.left.error || '未知错误' }}</div>
                            <div v-else key="left-default" class="monitor-placeholder"></div>
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
                            <video v-if="safeVideoStreams.right.active" key="right-video" autoplay playsinline
                                style="width: 484px; height: 275px; object-fit: cover;"
                                :src="safeVideoStreams.right.isPlayingVideo ? safeVideoStreams.right.videoUrl : undefined"
                                :volume="1.0" @error="handleVideoError('right', $event)"></video>
                            <div v-else-if="safeVideoStreams.right.loading" key="right-loading"
                                class="monitor-placeholder">正在连接摄像头...</div>
                            <div v-else-if="safeVideoStreams.right.error" key="right-error" class="monitor-placeholder">
                                连接失败: {{ safeVideoStreams.right.error || '未知错误' }}</div>
                            <div v-else key="right-default" class="monitor-placeholder"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="sehbeihao">
            <div class="left-item">
                <div class="status-title device-number-clickable" @click="goToLogPage">设备编号：{{ deviceName }}</div>
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
                            <el-input v-model="settingsForm.registerAddress" placeholder="请输入寄存器地址" class="form-input"
                                @input="validateNumberInput('registerAddress', $event)" />
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
import { API_CONFIG, buildUrl, buildCameraUrl } from '../config/api'
import flvjs from 'flv.js'
import logManager from '@/utils/logManager.js'

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
// 不再使用videoStreamManager

// 组件卸载标志
const isUnmounted = ref(false)

// 播放器类型 - 支持多种播放器
const PLAYER_TYPES = {
    HTML5: 'html5',
    FLV_JS: 'flv_js'
}

// 环境检测
const detectEnvironment = () => {
    const isElectron = typeof window !== 'undefined' && window.process && window.process.type
    const isLinux = typeof window !== 'undefined' && window.navigator.platform.toLowerCase().includes('linux')
    const isARM64 = typeof window !== 'undefined' && (window.navigator.userAgent.includes('aarch64') || window.navigator.userAgent.includes('arm64'))

    console.log('🔍 环境检测结果:', {
        isElectron,
        isLinux,
        isARM64,
        platform: typeof window !== 'undefined' ? window.navigator.platform : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
    })

    return { isElectron, isLinux, isARM64 }
}

// 选择合适的播放器类型
const getOptimalPlayerType = (streamUrl = '') => {
    // 根据文件扩展名和URL特征选择播放器
    const url = streamUrl.toLowerCase()

    // FLV格式使用FLV.js播放器
    if (url.includes('.flv') || url.includes('flv')) {
        return PLAYER_TYPES.FLV_JS
    }

    // HTTP-FLV流媒体格式判断（ live参数）
    if ((url.includes('live') || url.includes('app=live'))) {
        return PLAYER_TYPES.FLV_JS
    }

    // MP4格式使用HTML5原生播放器
    if (url.includes('.mp4') || url.includes('mp4')) {
        return PLAYER_TYPES.HTML5
    }

    // 默认使用HTML5播放器
    return PLAYER_TYPES.HTML5
}

// 当前播放器类型设置 - 根据环境自动选择
const optimalPlayerType = getOptimalPlayerType()
const playerSettings = ref({
    left: optimalPlayerType,
    right: optimalPlayerType
})

// 视频流状态
const videoStreams = ref({
    left: {
        active: true,
        loading: false,
        error: null,
        streamUrl: null,
        videoElement: null, // HTML5 video元素
        playerType: optimalPlayerType,
        isPlayingVideo: false,
        videoUrl: null,
        mediaErrorCount: 0,
        healthCheckInterval: null,
        stuckCount: 0
    },
    right: {
        active: true,
        loading: false,
        error: null,
        streamUrl: null,
        videoElement: null, // HTML5 video元素
        playerType: optimalPlayerType,
        isPlayingVideo: false,
        videoUrl: null,
        mediaErrorCount: 0,
        healthCheckInterval: null,
        stuckCount: 0
    }
})

// 固定区域视频播放管理
const currentPlayingVideos = ref({
    left: null,  // 左侧当前播放的视频信息
    right: null  // 右侧当前播放的视频信息
})

// 右侧区域视频轮播管理
const rightAreaVideoQueue = ref([])
const rightAreaCurrentIndex = ref(0)
let rightAreaPlayTimer = null

// 设备类型到视频文件的映射
const deviceVideoMap = {
    '灭火器': miehuoqiVideo,
    '消防水枪': shuiqiangVideo,
    '消防水带': shuiqiangVideo, // 消防水带使用和消防水枪相同的视频
    '泡沫喷枪': paomoqiangVideo
}

// 设备实例到视频文件的映射（用于特定设备的视频覆盖）
const deviceInstanceVideoMap = {
    // 这里可以根据具体设备ID进行映射，如果没有特定映射则使用deviceVideoMap
}

// 获取设备类型
const getDeviceType = (deviceName) => {
    if (deviceName.includes('灭火器')) return '灭火器'
    if (deviceName.includes('消防水枪')) return '消防水枪'
    if (deviceName.includes('水带')) return '消防水带'
    if (deviceName.includes('泡沫喷枪')) return '泡沫喷枪'
    return null
}

// 检查并更新左侧区域视频播放（灭火器专用）
const updateLeftAreaVideo = (devices) => {
    if (isUnmounted.value) return

    // 检查左侧区域（灭火器）

    // 检查是否有灭火器设备处于IN_USE状态
    const fireExtinguisherDevices = devices.filter(device => device.name.includes('灭火器'))
    // 静默处理灭火器设备状态

    const fireExtinguisherInUse = devices.find(device =>
        device.name.includes('灭火器') && device.currentStatus === 'IN_USE || WARNING'
    )

    // 静默处理使用中的灭火器

    if (fireExtinguisherInUse) {
        // 如果有灭火器在使用，播放灭火器视频
        if (!currentPlayingVideos.value.left || currentPlayingVideos.value.left.type !== '灭火器') {
            // 左侧区域开始播放灭火器视频
            const videoInfo = {
                id: fireExtinguisherInUse.id,
                name: fireExtinguisherInUse.name,
                type: '灭火器',
                videoUrl: deviceVideoMap['灭火器']
            }
            playVideoInArea('left', videoInfo)
        } else {
            // 左侧区域已在播放灭火器视频，无需重复播放
        }
    } else {
        // 如果没有灭火器在使用，恢复监控流
        if (currentPlayingVideos.value.left) {
            // 左侧区域停止播放灭火器视频，恢复监控流
            stopVideoAndRestoreStream('left')
        } else {
            // 左侧区域无需操作，已是监控流状态
        }
    }
}

// 检查并更新右侧区域视频播放（消防水枪/水带和泡沫喷枪）
const updateRightAreaVideo = (devices) => {
    if (isUnmounted.value) return

    // 检查右侧区域（消防水枪/水带和泡沫喷枪）

    // 检查消防水枪或消防水带是否处于IN_USE状态
    const waterDevices = devices.filter(device =>
        device.name.includes('消防水枪') || device.name.includes('消防水带')
    )
    // 静默处理消防水枪/水带设备状态

    const waterGunOrHoseInUse = devices.find(device =>
        (device.name.includes('消防水枪') || device.name.includes('消防水带')) &&
        device.currentStatus === 'IN_USE || WARNING'
    )
    // 静默处理使用中的消防水枪/水带

    // 检查泡沫喷枪是否处于IN_USE状态
    const foamDevices = devices.filter(device => device.name.includes('泡沫喷枪'))
    // 静默处理泡沫喷枪设备状态

    const foamGunInUse = devices.find(device =>
        device.name.includes('泡沫喷枪') && device.currentStatus === 'IN_USE || WARNING'
    )
    // 静默处理使用中的泡沫喷枪

    // 构建需要播放的视频列表
    const videosToPlay = []
    if (waterGunOrHoseInUse) {
        videosToPlay.push({
            id: waterGunOrHoseInUse.id,
            name: waterGunOrHoseInUse.name,
            type: waterGunOrHoseInUse.name.includes('消防水枪') ? '消防水枪' : '消防水带',
            videoUrl: deviceVideoMap['消防水枪'] // 消防水枪和消防水带使用同一个视频
        })
    }
    if (foamGunInUse) {
        videosToPlay.push({
            id: foamGunInUse.id,
            name: foamGunInUse.name,
            type: '泡沫喷枪',
            videoUrl: deviceVideoMap['泡沫喷枪']
        })
    }

    if (videosToPlay.length > 0) {
        // 有视频需要播放
        if (videosToPlay.length === 1) {
            // 只有一个视频，直接播放
            if (!currentPlayingVideos.value.right ||
                currentPlayingVideos.value.right.id !== videosToPlay[0].id) {
                // 右侧区域播放单个视频
                stopRightAreaRotation()
                playVideoInArea('right', videosToPlay[0])
            }
        } else {
            // 多个视频，需要轮播
            // 右侧区域开始轮播视频
            startRightAreaRotation(videosToPlay)
        }
    } else {
        // 没有视频需要播放，恢复监控流
        if (currentPlayingVideos.value.right) {
            // 右侧区域停止播放视频，恢复监控流
            stopRightAreaRotation()
            stopVideoAndRestoreStream('right')
        }
    }
}

// 开始右侧区域视频轮播
const startRightAreaRotation = (videos) => {
    if (isUnmounted.value) return

    // 停止之前的轮播
    stopRightAreaRotation()

    // 更新轮播队列
    rightAreaVideoQueue.value = videos
    rightAreaCurrentIndex.value = 0

    // 播放第一个视频
    if (videos.length > 0) {
        playVideoInArea('right', videos[0])

        // 如果有多个视频，设置轮播定时器
        if (videos.length > 1) {
            rightAreaPlayTimer = setInterval(() => {
                if (isUnmounted.value) {
                    stopRightAreaRotation()
                    return
                }

                rightAreaCurrentIndex.value = (rightAreaCurrentIndex.value + 1) % rightAreaVideoQueue.value.length
                const nextVideo = rightAreaVideoQueue.value[rightAreaCurrentIndex.value]
                // 右侧区域轮播到下一个视频
                playVideoInArea('right', nextVideo)
            }, 10000) // 每10秒切换一次
        }
    }
}

// 停止右侧区域视频轮播
const stopRightAreaRotation = () => {
    if (rightAreaPlayTimer) {
        clearInterval(rightAreaPlayTimer)
        rightAreaPlayTimer = null
    }
    rightAreaVideoQueue.value = []
    rightAreaCurrentIndex.value = 0
}

// 停止视频播放并恢复监控流
const stopVideoAndRestoreStream = (area) => {
    if (isUnmounted.value) return

    // 清除当前播放的视频信息
    currentPlayingVideos.value[area] = null

    // 停止视频播放
    stopVideoStream(area)

    // 恢复监控流
    nextTick(() => {
        restoreMonitorStream(area)
    })
}

// 在指定区域播放视频
const playVideoInArea = async (position, videoInfo) => {
    if (isUnmounted.value) return

    // 如果该区域已经在播放相同的视频，直接返回
    if (currentPlayingVideos.value[position] &&
        currentPlayingVideos.value[position].id === videoInfo.id) {
        // 区域已在播放相同视频，无需重复播放
        return
    }

    try {
        // 开始播放视频

        // 立即标记该区域为播放状态，防止并发
        currentPlayingVideos.value[position] = videoInfo

        // 停止当前区域的监控流
        await stopVideoStream(position)

        // 设置视频播放状态
        if (videoStreams.value && videoStreams.value[position]) {
            videoStreams.value[position].isPlayingVideo = true
            videoStreams.value[position].videoUrl = videoInfo.videoUrl
            videoStreams.value[position].active = true
            videoStreams.value[position].loading = false
            videoStreams.value[position].error = null
        }

        // currentPlayingVideos已在函数开头设置，这里不需要重复设置

        // 等待DOM更新
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 200))

        // 检查组件是否已卸载
        if (isUnmounted.value) return

        // 获取视频元素并开始播放
        const containerElement = document.querySelector(`#monitor-${position}`)
        if (!containerElement) {
            console.error(`❌ 未找到${position}区域容器元素`)
            onVideoError(position, videoInfo)
            return
        }

        const videoElement = containerElement.querySelector('video')
        if (!videoElement) {
            console.error(`❌ 未找到${position}区域视频元素`)
            onVideoError(position, videoInfo)
            return
        }

        // 清除之前的事件监听器
        videoElement.onended = null
        videoElement.onerror = null
        videoElement.onloadstart = null

        // 停止当前播放（如果有）
        if (!videoElement.paused) {
            videoElement.pause()
        }

        // 设置视频属性
        videoElement.style.width = '484px'
        videoElement.style.height = '275px'
        videoElement.style.objectFit = 'cover'
        videoElement.style.position = 'absolute'
        videoElement.style.top = '50%'
        videoElement.style.left = '50%'
        videoElement.style.transform = 'translate(-50%, -50%)'
        videoElement.preload = 'metadata'
        videoElement.muted = false
        videoElement.volume = 1.0

        // 设置事件监听器
        videoElement.onended = () => {
            if (isUnmounted.value) return
            // 视频播放完成
            onVideoEnded(position)
        }

        videoElement.onerror = (error) => {
            if (isUnmounted.value) return
            console.error(`❌ ${position}区域视频播放错误:`, error)
            onVideoError(position, videoInfo)
        }

        // 加载视频
        // 加载视频
        videoElement.src = videoInfo.videoUrl
        videoElement.load()

        // 等待视频加载完成后播放
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.error(`❌ ${position}区域视频加载超时:`, videoInfo.videoUrl)
                reject(new Error('视频加载超时'))
            }, 20000) // 增加超时时间到10秒

            videoElement.oncanplay = () => {
                // 视频可以播放
                clearTimeout(timeout)
                resolve()
            }

            videoElement.onerror = (error) => {
                console.error(`❌ ${position}区域视频加载错误:`, error, '视频路径:', videoInfo.videoUrl)
                clearTimeout(timeout)
                reject(error)
            }

            videoElement.onloadstart = () => {
                // 开始加载视频
            }
        })

        // 检查组件是否已卸载
        if (isUnmounted.value) return

        // 播放视频
        try {
            await videoElement.play()
            // 视频开始播放
        } catch (playError) {
            console.error(`❌ ${position}区域视频播放失败:`, playError)
            // 视频播放失败
            throw playError
        }

    } catch (error) {
        if (isUnmounted.value) return
        console.error(`❌ ${position}区域播放视频失败:`, error)

        // 清理状态，因为播放失败
        currentPlayingVideos.value[position] = null

        onVideoError(position, videoInfo)
    }
}

// 视频播放结束处理
const onVideoEnded = (position) => {
    if (isUnmounted.value) return

    // 视频播放结束

    // 清除当前播放的视频记录
    currentPlayingVideos.value[position] = null

    // 重置视频播放状态
    if (videoStreams.value && videoStreams.value[position]) {
        videoStreams.value[position].isPlayingVideo = false
        videoStreams.value[position].videoUrl = null
    }

    // 对于右侧区域，如果是轮播模式，不需要恢复监控流，轮播会自动处理
    if (position === 'right' && rightAreaVideoQueue.value.length > 1) {
        // 右侧区域轮播视频结束，等待轮播定时器处理下一个视频
        return
    }

    // 延迟恢复监控流
    setTimeout(() => {
        if (isUnmounted.value) return
        // 区域恢复监控流
        restoreMonitorStream(position)
    }, 500)
}

// 视频播放错误处理
const onVideoError = (position, videoInfo) => {
    if (isUnmounted.value) return

    console.error(`❌ ${position}区域视频播放错误:`, videoInfo?.name || '未知视频')
    // 清理区域播放状态

    // 清除当前播放的视频记录
    currentPlayingVideos.value[position] = null

    // 重置视频播放状态
    if (videoStreams.value && videoStreams.value[position]) {
        videoStreams.value[position].isPlayingVideo = false
        videoStreams.value[position].videoUrl = null
        videoStreams.value[position].error = null // 清除错误状态
        videoStreams.value[position].loading = false
    }

    // 清理视频元素状态
    try {
        const containerElement = document.querySelector(`#monitor-${position}`)
        if (containerElement) {
            const videoElement = containerElement.querySelector('video')
            if (videoElement) {
                videoElement.pause()
                videoElement.src = ''
                videoElement.load()
                // 清除事件监听器
                videoElement.onended = null
                videoElement.onerror = null
                videoElement.oncanplay = null
            }
        }
    } catch (error) {
        console.warn(`清理${position}区域视频元素时出错:`, error)
    }

    // 延迟恢复监控流
    setTimeout(() => {
        if (isUnmounted.value) return

        // 区域错误处理完成，恢复监控流
        restoreMonitorStream(position)
    }, 500) // 延迟500ms处理
}

// 恢复监控流
const restoreMonitorStream = async (position) => {
    if (isUnmounted.value) return

    // 恢复区域监控流

    // 重置状态
    if (videoStreams.value && videoStreams.value[position]) {
        videoStreams.value[position].isPlayingVideo = false
        videoStreams.value[position].videoUrl = null
        videoStreams.value[position].active = false
        videoStreams.value[position].error = null
    }

    // 重新启动监控流
    await startVideoStream(position)
}

// 安全的视频流状态访问器
const safeVideoStreams = computed(() => {
    const defaultStream = { active: true, loading: false, error: null, streamUrl: null, isPlayingVideo: false, videoUrl: null }

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
            active: streams.left?.active ?? true,
            loading: streams.left?.loading || false,
            error: streams.left?.error || null,
            streamUrl: streams.left?.streamUrl || null,
            isPlayingVideo: streams.left?.isPlayingVideo || false,
            videoUrl: streams.left?.videoUrl || null
        },
        right: {
            active: streams.right?.active ?? true,
            loading: streams.right?.loading || false,
            error: streams.right?.error || null,
            streamUrl: streams.right?.streamUrl || null,
            isPlayingVideo: streams.right?.isPlayingVideo || false,
            videoUrl: streams.right?.videoUrl || null
        }
    }
})

// 启动视频流
const startVideoStream = async (position) => {
    const cameraIndex = position === 'left' ? 0 : 1
    console.log(`🎬 启动${position}区域视频流，摄像头索引:${cameraIndex}`)
    logManager.addLog('info', `启动${position}区域视频流，摄像头索引:${cameraIndex}`, { 
        deviceId: deviceName.value || '001', 
        monitorArea: position === 'left' ? '左侧区域' : '右侧区域',
        module: '视频监控',
        cameraIndex
    })

    try {
        if (isUnmounted.value || !videoStreams.value?.[position]) {
            console.log(`⚠️ ${position}区域视频流启动被跳过：组件已卸载或状态不存在`)
            return
        }

        videoStreams.value[position].loading = true
        videoStreams.value[position].error = null
        console.log(`📊 ${position}区域视频流状态设置为加载中`)
        // 播放器类型将在获取streamUrl后动态选择

        // 获取视频流地址
        // 第一步：调用摄像头接口获取RTSP URL
        const cameraUrl = buildCameraUrl(cameraIndex)
        console.log('📡 调用摄像头接口:', cameraUrl)
        logManager.addLog('info', `调用摄像头接口: ${cameraUrl}`, { 
            deviceId: deviceName.value || '001', 
            monitorArea: position === 'left' ? '左侧区域' : '右侧区域',
            module: '视频监控',
            cameraIndex,
            cameraUrl
        })

        const cameraResponse = await request.get(cameraUrl)
        console.log(`📡 ${position}区域(cameraIndex=${cameraIndex})摄像头接口响应:`, cameraResponse.data)
        logManager.addLog('info', `摄像头接口响应成功`, { 
            deviceId: deviceName.value || '001', 
            monitorArea: position === 'left' ? '左侧区域' : '右侧区域',
            module: '视频监控',
            cameraIndex,
            response: cameraResponse.data
        })

        if (!cameraResponse.data?.rtspUrl) {
            console.error(`❌ ${position}区域摄像头接口未返回RTSP URL:`, cameraResponse.data)
            throw new Error('未获取到RTSP URL')
        }

        const rtspUrl = cameraResponse.data.rtspUrl
        console.log('📹 获取到RTSP URL:', rtspUrl)

        // 调用推流接口获取流媒体URL
        const streamApiUrl = buildUrl(API_CONFIG.ENDPOINTS.VIDEO_start)
        console.log('🚀 调用推流接口:', streamApiUrl)
        
        const streamResponse = await request.post(streamApiUrl, {
            cameraId: cameraIndex.toString(),
            rtspUrl: rtspUrl
        })
        
        console.log(`🎯 ${position}区域(cameraIndex=${cameraIndex})推流请求参数:`, {
            cameraId: cameraIndex.toString(),
            rtspUrl: rtspUrl
        })
        console.log(`🚀 ${position}区域(cameraIndex=${cameraIndex})推流接口响应:`, streamResponse.data)

        if (!streamResponse.data?.flvUrl) {
            console.error(`❌ ${position}区域推流接口未返回FLV URL:`, streamResponse.data)
            throw new Error('未获取到推流地址')
        }

        // const streamUrl = streamResponse.data.flvUrl
        // 根据摄像头位置配置不同的流媒体地址
        const streamUrl = position === 'left' 
            ? "http://192.168.1.200:8081/live.flv"  // 左侧区域摄像头
            : "http://192.168.1.200:8080/live.flv"  // 右侧区域摄像头
        console.log(`🎬 ${position}区域(cameraIndex=${cameraIndex})获取到流媒体地址:`, streamUrl)
        logManager.addLog('info', `获取到流媒体地址: ${streamUrl}`, { 
            deviceId: deviceName.value || '001', 
            monitorArea: position === 'left' ? '左侧区域' : '右侧区域',
            module: '视频监控',
            cameraIndex,
            streamUrl
        })
        
        // 检查stream参数是否正确
        // if (streamUrl && streamUrl.includes('stream=')) {
        //     const streamParam = streamUrl.match(/stream=(\d+)/)
        //     console.log(`🔍 ${position}区域stream参数检查:`, streamParam ? streamParam[1] : '未找到stream参数')
        // }

        if (streamUrl) {
            // 根据URL格式动态选择播放器类型
            const optimalPlayerType = getOptimalPlayerType(streamUrl)
            videoStreams.value[position].playerType = optimalPlayerType
            console.log('🎯 选择播放器类型:', optimalPlayerType)

            videoStreams.value[position].active = true
            videoStreams.value[position].streamUrl = streamUrl

            await nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            if (!isUnmounted.value) {
                // 使用选定的播放器播放流媒体
                await initPlayer(position, streamUrl)
            }
        }
    } catch (error) {
        console.error(`❌ ${position}区域视频流启动失败:`, error)
        
        let errorMessage = error.message || '连接异常'
        
        // 根据错误类型提供更具体的错误信息
        if (error.message && error.message.includes('status code 500')) {
            errorMessage = '流媒体服务器内部错误(500) - 请检查流媒体服务器状态'
        } else if (error.message && error.message.includes('ECONNRESET')) {
            errorMessage = '后端API服务器连接失败 - 请检查服务器是否运行'
        } else if (error.message && error.message.includes('timeout')) {
            errorMessage = '连接超时 - 请检查网络连接'
        } else if (error.message && error.message.includes('未获取到')) {
            errorMessage = '后端API返回数据异常 - ' + error.message
        }
        
        logManager.addLog('error', `${position}区域视频流启动失败: ${errorMessage}`, { 
            deviceId: deviceName.value || '001', 
            monitorArea: position === 'left' ? '左侧区域' : '右侧区域',
            module: '视频监控',
            cameraIndex: position === 'left' ? 0 : 1,
            error: error.message,
            errorType: error.name || 'Unknown'
        })
        
        if (videoStreams.value?.[position]) {
            videoStreams.value[position].error = errorMessage
            videoStreams.value[position].active = false
        }
    } finally {
        if (videoStreams.value?.[position]) {
            videoStreams.value[position].loading = false
        }
    }
}



// HTML5播放器健康检查
const startHtml5HealthCheck = (position, videoElement) => {
    const healthCheckInterval = setInterval(() => {
        if (isUnmounted.value || !videoElement) {
            clearInterval(healthCheckInterval)
            return
        }

        // 检查video元素是否还在DOM中
        if (!document.contains(videoElement)) {
            clearInterval(healthCheckInterval)
            return
        }

        // 检查播放状态
        try {
            const isPlaying = !videoElement.paused && !videoElement.ended && videoElement.readyState > 2

            // 如果视频停止播放，尝试重新播放
            if (!isPlaying && !videoElement.paused && videoElement.readyState > 0) {
                videoElement.play().catch(e => {
                    // 静默处理播放失败
                })
            }
        } catch (e) {
            // 静默处理状态检查失败
        }
    }, 10000) // 每10秒检查一次，减少CPU占用

    // 存储定时器ID以便清理
    if (!videoStreams.value[position].healthCheckInterval) {



        videoStreams.value[position].healthCheckInterval = healthCheckInterval
    }
}



// 统一播放器初始化函数
const initPlayer = async (position, streamUrl) => {
    const playerType = videoStreams.value[position]?.playerType || optimalPlayerType

    try {
        if (playerType === PLAYER_TYPES.HTML5) {
            await initHtml5Player(position, streamUrl)
        } else if (playerType === PLAYER_TYPES.FLV_JS) {
            await initFlvJsPlayer(position, streamUrl)
        } else {
            if (videoStreams.value?.[position]) {
                videoStreams.value[position].error = `不支持的播放器类型: ${playerType}`
            }
        }
    } catch (error) {
        if (videoStreams.value?.[position]) {
            videoStreams.value[position].error = `播放器初始化失败: ${error.message}`
        }
    }
}



// 初始化HTML5播放器
const initHtml5Player = async (position, streamUrl) => {
    try {
        if (isUnmounted.value) {
            return
        }

        // 查找视频容器元素
        const containerElement = document.querySelector(`#monitor-${position}`)
        if (!containerElement) {
            if (videoStreams.value?.[position]) {
                videoStreams.value[position].error = '容器元素未找到'
            }
            return
        }

        // 清理现有video实例
        if (videoStreams.value[position]?.videoElement) {
            videoStreams.value[position].videoElement.remove()
            videoStreams.value[position].videoElement = null
        }

        // 清空容器内容
        containerElement.innerHTML = ''

        // 创建video元素
        const videoElement = document.createElement('video')
        videoElement.width = 488
        videoElement.height = 279
        videoElement.autoplay = true
        videoElement.muted = true
        videoElement.controls = false
        videoElement.playsInline = true
        videoElement.style.objectFit = 'cover'
        videoElement.style.width = '100%'
        videoElement.style.height = '100%'

        // 设置视频源
        videoElement.src = streamUrl
        console.log('🎬 HTML5播放器设置视频源:', streamUrl)

        // 添加事件监听器
        videoElement.addEventListener('loadstart', () => {
            console.log('📺 HTML5播放器开始加载视频')
        })

        videoElement.addEventListener('canplay', () => {
            console.log('✅ HTML5播放器可以播放')
            videoStreams.value[position].isPlayingVideo = true
        })

        videoElement.addEventListener('playing', () => {
            console.log('▶️ HTML5播放器正在播放')
            videoStreams.value[position].isPlayingVideo = true
        })

        videoElement.addEventListener('pause', () => {
            console.log('⏸️ HTML5播放器暂停')
            videoStreams.value[position].isPlayingVideo = false
        })

        videoElement.addEventListener('error', (error) => {
            console.error('❌ HTML5播放器错误:', error)
            if (videoStreams.value?.[position]) {
                videoStreams.value[position].error = 'HTML5播放器错误: ' + (error.message || '未知错误')
                videoStreams.value[position].isPlayingVideo = false
            }
        })

        videoElement.addEventListener('loadeddata', () => {
            console.log('📊 HTML5播放器数据加载完成')
        })

        videoElement.addEventListener('loadedmetadata', () => {
            console.log('📋 HTML5播放器元数据加载完成')
        })

        videoElement.addEventListener('stalled', () => {
            // 静默处理加载停滞
        })

        videoElement.addEventListener('waiting', () => {
            // 静默处理缓冲
        })

        // 添加到容器
        containerElement.appendChild(videoElement)

        // 保存video元素引用
        videoStreams.value[position].videoElement = videoElement

        // 尝试播放
        try {
            await videoElement.play()
        } catch (playError) {
            // 自动播放失败是常见的，不算错误
        }

        // 启动视频流健康检查
        startHtml5HealthCheck(position, videoElement)

    } catch (error) {
        if (videoStreams.value?.[position]) {
            videoStreams.value[position].error = 'HTML5播放器初始化失败: ' + error.message
        }
    }
}


// 初始化FLV.js播放器
const initFlvJsPlayer = async (position, streamUrl) => {
    try {
        if (isUnmounted.value) {
            return
        }

        // 检查flv.js支持
        if (!flvjs.isSupported()) {
            if (videoStreams.value?.[position]) {
                videoStreams.value[position].error = '浏览器不支持FLV播放'
            }
            return
        }

        // 查找视频容器元素
        const containerElement = document.querySelector(`#monitor-${position}`)
        if (!containerElement) {
            if (videoStreams.value?.[position]) {
                videoStreams.value[position].error = '容器元素未找到'
            }
            return
        }

        // 清理现有播放器实例
        if (videoStreams.value[position]?.flvPlayer) {
            videoStreams.value[position].flvPlayer.destroy()
            videoStreams.value[position].flvPlayer = null
        }

        if (videoStreams.value[position]?.videoElement) {
            videoStreams.value[position].videoElement.remove()
            videoStreams.value[position].videoElement = null
        }

        // 清空容器内容
        containerElement.innerHTML = ''

        // 创建video元素
        const videoElement = document.createElement('video')
        videoElement.style.width = '484px'
        videoElement.style.height = '275px'
        videoElement.style.objectFit = 'cover'
        videoElement.controls = false
        videoElement.autoplay = true
        videoElement.muted = true // 自动播放需要静音
        videoElement.playsInline = true

        // FLV.js配置参数
        const flvPlayerConfig = {
            enableWorker: false,        // 禁用Web Worker（Electron兼容性）
            enableStashBuffer: false,   // 禁用缓存（降低延迟）
            isLive: true,              // 直播流模式
            lazyLoad: true,
            lazyLoadMaxDuration: 3 * 60,
            autoCleanupSourceBuffer: true,
            autoCleanupMaxBackwardDuration: 3 * 60,
            autoCleanupMinBackwardDuration: 2 * 60,
            fixAudioTimestampGap: true,
            accurateSeek: false,
            // 网络相关配置
            headers: {},               // 清空自定义头部
            reuseRedirectedURL: true,  // 重用重定向URL
            referrerPolicy: 'no-referrer' // 设置referrer策略
        }

        // 移除网络连接预检查，避免干扰FLV播放器连接
        logManager.addLog('info', `开始配置FLV播放器: ${streamUrl}`, { 
            deviceId: deviceName.value || '001', 
            monitorArea: position === 'left' ? '左侧区域' : '右侧区域',
            module: '视频监控',
            streamUrl,
            action: '配置FLV播放器'
        })

        // 创建FLV播放器实例
        console.log('🎥 配置HTTP-FLV流播放器:', streamUrl)
        let playerMediaDataSource = {
            type: 'flv',
            url: streamUrl,
            isLive: true,
            cors: false,  // 禁用CORS，避免跨域问题
            withCredentials: false,
            hasAudio: false,  // 如果流没有音频，可以提高兼容性
            hasVideo: true
        }

        console.log('🎬 创建FLV播放器，配置:', { playerMediaDataSource, flvPlayerConfig })
        const flvPlayer = flvjs.createPlayer(playerMediaDataSource, flvPlayerConfig)

        // 绑定事件监听器
        videoElement.addEventListener('loadstart', () => {
            // 静默处理加载开始
        })

        videoElement.addEventListener('canplay', () => {
            if (videoStreams.value?.[position]) {
                videoStreams.value[position].loading = false
                videoStreams.value[position].active = true
            }
        })

        videoElement.addEventListener('play', () => {
            // 静默处理播放开始
        })

        videoElement.addEventListener('pause', () => {
            // 静默处理暂停
        })

        videoElement.addEventListener('error', (error) => {
            if (videoStreams.value?.[position]) {
                videoStreams.value[position].error = 'FLV播放器错误: ' + (error.message || '未知错误')
            }
        })

        videoElement.addEventListener('stalled', () => {
            // 静默处理加载停滞
        })

        videoElement.addEventListener('waiting', () => {
            // 静默处理缓冲
        })

        // FLV播放器事件监听
        flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail, errorInfo) => {
            console.error('FLV播放器错误:', {
                errorType,
                errorDetail,
                errorInfo,
                streamUrl
            })
            if (videoStreams.value?.[position]) {
                let errorMessage = `FLV播放错误: ${errorDetail}`
                
                // 根据错误类型提供更具体的错误信息
                if (errorDetail && errorDetail.includes('NetworkError')) {
                    errorMessage += ' - 网络连接失败，请检查流媒体服务器状态'
                } else if (errorDetail && errorDetail.includes('CORS')) {
                    errorMessage += ' - 跨域访问被阻止，请检查服务器CORS配置'
                } else if (errorDetail && errorDetail.includes('404')) {
                    errorMessage += ' - 流地址不存在或已失效'
                } else if (errorDetail && errorDetail.includes('timeout')) {
                    errorMessage += ' - 连接超时，请检查网络连接'
                }
                
                videoStreams.value[position].error = errorMessage
            }
        })

        flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
            // 静默处理加载完成
        })

        flvPlayer.on(flvjs.Events.RECOVERED_EARLY_EOF, () => {
            // 静默处理EOF恢复
        })

        // 将video元素添加到容器
        containerElement.appendChild(videoElement)

        // 绑定媒体元素
        flvPlayer.attachMediaElement(videoElement)

        // 加载并播放
        await flvPlayer.load()

        try {
            await videoElement.play()
        } catch (playError) {
            // 自动播放失败不算致命错误，用户可以手动点击播放
        }

        // 保存播放器实例引用
        videoStreams.value[position].flvPlayer = flvPlayer
        videoStreams.value[position].videoElement = videoElement

        // 启动FLV播放器健康检查
        startFlvJsHealthCheck(position, flvPlayer, videoElement)

    } catch (error) {
        if (videoStreams.value?.[position]) {
            videoStreams.value[position].error = 'FLV播放器初始化失败: ' + error.message
        }
    }
}

// FLV.js播放器健康检查
const startFlvJsHealthCheck = (position, flvPlayer, videoElement) => {
    const healthCheckInterval = setInterval(() => {
        try {
            if (isUnmounted.value) {
                clearInterval(healthCheckInterval)
                return
            }

            if (!videoElement || !videoElement.parentNode) {
                clearInterval(healthCheckInterval)
                return
            }

            const isPlaying = !videoElement.paused && !videoElement.ended && videoElement.readyState > 2

            // 如果视频停止播放，尝试恢复
            if (!isPlaying && !videoElement.paused) {
                videoElement.play().catch(e => {
                    // 静默处理播放失败
                })
            }

        } catch (e) {
            // 静默处理状态检查失败
        }
    }, 30000) // 每30秒检查一次，减少CPU占用

    // 保存健康检查定时器引用
    if (videoStreams.value?.[position]) {
        videoStreams.value[position].flvHealthCheckInterval = healthCheckInterval
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

        // 清理健康检查定时器
        if (videoStreams.value[position].healthCheckInterval) {
            clearInterval(videoStreams.value[position].healthCheckInterval)
            videoStreams.value[position].healthCheckInterval = null
        }



        // 根据播放器类型进行清理
        const playerType = videoStreams.value[position].playerType || optimalPlayerType

        if (playerType === PLAYER_TYPES.HTML5 && videoStreams.value[position].videoElement) {
            // 清理HTML5播放器
            try {
                videoStreams.value[position].videoElement.pause()
                videoStreams.value[position].videoElement.src = ''
                videoStreams.value[position].videoElement.load()
                videoStreams.value[position].videoElement.remove()
            } catch (cleanupError) {
                console.warn(`⚠️ [stopVideoStream] ${position}区域HTML5播放器清理时出现警告:`, cleanupError)
            }
            videoStreams.value[position].videoElement = null
            // HTML5播放器已清理
        } else if (playerType === PLAYER_TYPES.FLV_JS) {
            // 清理FLV.js播放器
            try {
                // 清理FLV健康检查定时器
                if (videoStreams.value[position].flvHealthCheckInterval) {
                    clearInterval(videoStreams.value[position].flvHealthCheckInterval)
                    videoStreams.value[position].flvHealthCheckInterval = null
                }

                // 清理FLV播放器实例
                if (videoStreams.value[position].flvPlayer) {
                    videoStreams.value[position].flvPlayer.destroy()
                    videoStreams.value[position].flvPlayer = null
                }

                // 清理video元素
                if (videoStreams.value[position].videoElement) {
                    videoStreams.value[position].videoElement.pause()
                    videoStreams.value[position].videoElement.src = ''
                    videoStreams.value[position].videoElement.load()
                    videoStreams.value[position].videoElement.remove()
                    videoStreams.value[position].videoElement = null
                }

                // 清理容器
                const containerElement = document.querySelector(`#monitor-${position}`)
                if (containerElement) {
                    containerElement.innerHTML = ''
                }

                // FLV.js播放器已清理
            } catch (cleanupError) {
                console.warn(`⚠️ [stopVideoStream] ${position}区域FLV.js播放器清理时出现警告:`, cleanupError)
            }
        }

        // 重置视频流状态
        videoStreams.value[position].active = false
        videoStreams.value[position].streamUrl = null
        videoStreams.value[position].error = null
        // 视频流已停止
    } catch (error) {
        console.error(`停止${position}视频流失败:`, error)
    }
}





// 处理视频错误
const handleVideoError = (position, event) => {
    console.error(`${position}视频播放错误:`, event)
    // 视频播放错误
    if (!isUnmounted.value && videoStreams.value && videoStreams.value[position]) {
        videoStreams.value[position].error = '视频播放失败'
        videoStreams.value[position].active = false
    }
}

// 启动所有视频流
const startAllVideoStreams = async () => {
    console.log('🚀 开始启动所有视频流')
    // 开始启动所有视频流
    await Promise.all([
        startVideoStream('left'),
        startVideoStream('right')
    ])
    console.log('✅ 所有视频流启动完成')
}

// 停止所有视频流
const stopAllVideoStreams = async () => {
    // 停止所有视频流
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

// 导入视频资源
import miehuoqiVideo from '/static/vid/miehuoqi.mp4'
import shuiqiangVideo from '/static/vid/shuiqiang.mp4'
import paomoqiangVideo from '/static/vid/paomoqiang.mp4'

const router = useRouter()
const deviceStore = useDeviceStore()





const todetail = () => {
    router.push({ name: 'LiShi' })
}

// 跳转到日志页面
const goToLogPage = () => {
    router.push({ name: 'Log' })
}

// 日志查看功能已移除
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
                    // 生产环境：使用127.0.0.1“8061拼接完整的服务器地址
                    const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8061'
                    displayPath = iconPath.startsWith('http') ? iconPath :
                        `${apiBaseUrl}${iconPath}`
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
        // 设备参数保存成功
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
        // 设备号保存成功
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
        // 自定义设备信息保存成功
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

// 获取实时监控流


const handleSettingsConfirm = async () => {
    await Promise.all([saveThresholds(), saveStationNumber(), saveCustomDeviceInfo()])
    // 重新获取设备参数数据，确保更新后的数据能够渲染出来
    await fetchThresholds()
    showSettingsDialog.value = false
}

// 备用蜂鸣器方案（使用HTML5 Audio）
const playFallbackBeep = (frequency) => {
    try {
        // 创建一个简单的蜂鸣声音频文件的Data URL
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = 'square'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)

        // 备用蜂鸣器播放
    } catch (error) {
        console.error('备用蜂鸣器也失败:', error)
        // 最后的备用方案：系统提示音
        if (window.electronAPI && window.electronAPI.playSystemBeep) {
            window.electronAPI.playSystemBeep()
        }
    }
}

// 蜂鸣器报警功能
const createBeepSound = async () => {
    try {
        // 检查浏览器是否支持Web Audio API
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.error('浏览器不支持Web Audio API')
            playFallbackBeep(1000)
            return
        }

        // 创建音频上下文
        alarmState.value.audioContext = new (window.AudioContext || window.webkitAudioContext)()

        // 检查音频上下文状态，如果是suspended需要恢复
        if (alarmState.value.audioContext.state === 'suspended') {
            await alarmState.value.audioContext.resume()
            // 音频上下文已恢复
        }

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

        // 蜂鸣器报警已启动
    } catch (error) {
        console.error('创建蜂鸣器声音失败:', error)
        playFallbackBeep(1000)
    }
}

// 预警蜂鸣器功能
const createWarningBeepSound = async () => {
    try {
        // 检查浏览器是否支持Web Audio API
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.error('浏览器不支持Web Audio API')
            playFallbackBeep(800)
            return
        }

        // 创建音频上下文
        alarmState.value.warningAudioContext = new (window.AudioContext || window.webkitAudioContext)()

        // 检查音频上下文状态，如果是suspended需要恢复
        if (alarmState.value.warningAudioContext.state === 'suspended') {
            await alarmState.value.warningAudioContext.resume()
            // 预警音频上下文已恢复
        }

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

        // 预警蜂鸣器已启动
    } catch (error) {
        console.error('创建预警蜂鸣器声音失败:', error)
        playFallbackBeep(800)
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
        // 蜂鸣器报警已停止
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
        // 预警蜂鸣器已停止
    } catch (error) {
        console.error('停止预警蜂鸣器声音失败:', error)
    }
}

// 启动报警（闪烁+蜂鸣器）
const startAlarm = async () => {
    if (alarmState.value.isAlarming) return

    // 启动报警模式
    alarmState.value.isAlarming = true

    // 启动蜂鸣器
    await createBeepSound()

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
const startWarning = async () => {
    if (alarmState.value.isWarning) return

    // 启动预警模式
    alarmState.value.isWarning = true

    // 启动预警蜂鸣器
    await createWarningBeepSound()

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

    // 停止报警模式
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

    // 停止预警模式
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

    // 检查报警状态

    // 检查deviceStore是否有效
    if (!deviceStore) {
        console.warn('deviceStore无效，跳过报警状态检查')
        return
    }

    // 静默处理设备数据
    // 静默处理告警数据

    try {
        // 只检查device数组中的状态
        const hasDeviceAlarm = Array.isArray(deviceStore.devices) ?
            deviceStore.devices.some(device => device?.currentStatus === 'ALARM') : false

        const hasDeviceWarning = Array.isArray(deviceStore.devices) ?
            deviceStore.devices.some(device => device?.currentStatus === 'WARNING' || device?.currentStatus === 'IN_USE') : false

        // 静默处理设备ALARM状态
        // 静默处理设备WARNING状态
        // 静默处理当前是否正在报警
        // 静默处理当前是否正在预警

        // 处理ALARM状态（优先级最高）
        if (hasDeviceAlarm && !alarmState.value?.isAlarming) {
            // 触发设备报警
            // 如果正在预警，先停止预警
            if (alarmState.value?.isWarning) {
                stopWarning()
            }
            startAlarm().catch(error => {
                console.error('启动报警失败:', error)
            })
        } else if (!hasDeviceAlarm && alarmState.value?.isAlarming) {
            // 停止设备报警
            stopAlarm()
        }

        // 处理WARNING状态（只有在没有ALARM时才处理）
        if (!hasDeviceAlarm) {
            if (hasDeviceWarning && !alarmState.value?.isWarning) {
                // 触发设备预警
                startWarning().catch(error => {
                    console.error('启动预警失败:', error)
                })
            } else if (!hasDeviceWarning && alarmState.value?.isWarning) {
                // 停止设备预警
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
                return { status: 'maintenance', statusText: '开' }
            case 'ALARM':
                return { status: 'fault', statusText: '缺失' }
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
        // 对设备数组进行排序，将customDevice1移动到最后
        const sortedDevices = [...deviceStore.devices].sort((a, b) => {
            if (a.id === 'customDevice1') return 1
            if (b.id === 'customDevice1') return -1
            return 0
        })

        const devices = sortedDevices.map(device => {
            if (!device) return null
            const statusInfo = getDeviceStatus(device.currentStatus, device.name)

            // 处理设备图标 - 优先使用API返回的icon字段
            let deviceIcon = miehuoImg // 默认图标
            if (device.icon) {
                // 如果API返回了icon字段，优先使用
                if (process.env.NODE_ENV === 'development') {
                    // 开发环境：使用127.0.0.1:8061拼接完整路径
                    deviceIcon = device.icon.startsWith('http') ? device.icon : `http://127.0.0.1:8061${device.icon}`
                } else {
                    // 生产环境：使用127.0.0.1“8061拼接完整路径
                    const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8061'
                    deviceIcon = device.icon.startsWith('http') ? device.icon : `${apiBaseUrl}${device.icon}`
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

        // 检查设备状态变化，触发固定区域视频播放
        checkDeviceStatusForVideo(deviceStore.devices)
    } catch (error) {
        console.warn('更新设备分组时发生错误:', error)
    }
}

// 检查设备状态变化，触发固定区域视频播放
const checkDeviceStatusForVideo = (devices) => {
    if (isUnmounted.value || !devices || !Array.isArray(devices)) return

    // 检查设备状态，更新视频播放
    // 静默处理设备数据

    // 更新左侧区域（灭火器专用）
    updateLeftAreaVideo(devices)

    // 更新右侧区域（消防水枪/水带和泡沫喷枪）
    updateRightAreaVideo(devices)
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
        productTime: formatDateTime(alarm?.alarmStartTime),
        endTime: formatDateTime(alarm?.alarmEndTime)
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
    // 上传成功
    if (response && response.path) {
        // 保存原始路径
        settingsForm.value.uploadedImage = response.path
        // 根据环境处理图片显示路径
        if (process.env.NODE_ENV === 'development') {
            // 开发环境：使用127.0.0.1:8061拼接完整的服务器地址
            settingsForm.value.uploadedImageUrl = response.path.startsWith('http') ?
                response.path : `http://127.0.0.1:8061${response.path}`
        } else {
            // 生产环境：使用127.0.0.1“8061拼接完整的服务器地址
            const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8061'
            settingsForm.value.uploadedImageUrl = response.path.startsWith('http') ?
                response.path : `${apiBaseUrl}${response.path}`
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
    // 静默处理登录信息

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
                    // 截图保存成功
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
                    // 截图保存成功
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

// 视频播放计数器
const videoPlayCount = ref(0)



onMounted(async () => {
    updateTime()
    timer = setInterval(updateTime, 1000)

    // 启动真实API轮询
    deviceStore.startPolling()

    // 监听设备数据变化，更新界面
    storeUnsubscribe = deviceStore.$subscribe(() => {
        // 设备数据更新
        updateDeviceGroups() // updateDeviceGroups内部已经调用了checkDeviceStatusForVideo
        // 检查报警状态
        checkAlarmStatus()
    })

    // 初始化数据
    updateDeviceGroups()

    // 获取设备参数数据，包括设备名称（不阻止后续流程）
    try {
        await Promise.all([fetchThresholds(), fetchStationNumber()])
    } catch (error) {
        console.warn('获取设备参数失败，但不影响视频流启动:', error)
    }

    // 初始检查报警状态
    checkAlarmStatus()


    // 开始初始化设备监控系统

    // 重置视频播放计数
    videoPlayCount.value = 0

    // 确保DOM完全渲染后再启动视频流
    await nextTick()
    // 添加更长的延迟确保DOM元素完全准备好和稳定
    startupTimer = setTimeout(async () => {
        if (isUnmounted.value) {
            // 组件已卸载，跳过视频流启动
            return
        }
        try {
            // 开始启动视频流，DOM应该已经完全准备好
            console.log('📊 当前视频流状态:', JSON.stringify({
                left: { loading: videoStreams.value?.left?.loading, active: videoStreams.value?.left?.active, error: videoStreams.value?.left?.error },
                right: { loading: videoStreams.value?.right?.loading, active: videoStreams.value?.right?.active, error: videoStreams.value?.right?.error }
            }, null, 2))
            await startAllVideoStreams()
            // 视频流启动完成
        } catch (error) {
            console.error('❌ 启动视频流失败:', error)
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

    // 清理右侧区域轮播定时器
    stopRightAreaRotation()



    // 取消deviceStore订阅，防止组件卸载后仍触发回调
    if (storeUnsubscribe) {
        storeUnsubscribe()
        storeUnsubscribe = null
    }

    // 停止设备状态轮询
    deviceStore.stopPolling()

    // 安全地清理健康检查定时器
    try {
        if (videoStreams.value && videoStreams.value.left) {
            if (videoStreams.value.left.healthCheckInterval) {
                clearInterval(videoStreams.value.left.healthCheckInterval)
                videoStreams.value.left.healthCheckInterval = null
            }
        }
        if (videoStreams.value && videoStreams.value.right) {
            if (videoStreams.value.right.healthCheckInterval) {
                clearInterval(videoStreams.value.right.healthCheckInterval)
                videoStreams.value.right.healthCheckInterval = null
            }
        }

        // 停止所有视频流
        await stopAllVideoStreams()
        // 所有视频流已通过stopAllVideoStreams停止
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

        .device-number-clickable {
            cursor: pointer;
            transition: all 0.3s ease;
            
            &:hover {
                color: #32A4F1;
                text-shadow: 0 0 5px rgba(50, 164, 241, 0.5);
                transform: scale(1.05);
            }
            
            &:active {
                transform: scale(0.98);
            }
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

/* 监控显示区域样式 */
.monitor-display {
    position: relative;
    width: 100%;
    height: 100%;
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