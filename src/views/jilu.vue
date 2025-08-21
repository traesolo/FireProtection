<template>
    <div class="home">
        <!-- 头部区域 -->
        <div class="header">
            <div class="datetime">{{ currentTime }}</div>
            <div class="title">告警历史记录</div>
            <div class="controls">
                <div class="control-item" @click="handleSettings">
                    <img src="/static/index/sehzhi.png" alt="设置" class="control-icon" />
                    <span>设置</span>
                </div>
                <div class="control-item" @click="handleExit">
                    <img src="/static/index/guan.png" alt="退出" class="control-icon" />
                    <span>退出</span>
                </div>
            </div>
        </div>
        <!-- 返回首页 -->
        <div class="toback" @click="toback">
            <div class="imgclick">
                <img src="/static/index/fanhui.png" alt="">
            </div>
            <div class="fanhui">
                返回主页
            </div>
        </div>

        <!-- 表格 -->
        <div class="footer">
            <!-- 搜索区域 -->
            <div class="search">
                <div>设备类型：</div>
                <div>
                    <el-select class="elselect" v-model="value" placeholder="请选择设备类型" :popper-append-to-body="false"
                        popper-class="custom-select-dropdown">
                        <el-option class="eloption" v-for="item in typelist" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </div>
                <div class="cz" @click="handleReset">重置</div>
                <div class="ss" @click="handleSearch">搜索</div>
            </div>
            <div class="tables">
                <el-table :data="alarmData" class="alarm-table">
                    <el-table-column prop="id" label="序号" width="136" align="center" />
                    <el-table-column prop="name" label="设备名称" width="136" align="center" />
                    <el-table-column prop="status" label="报警信息" width="136" align="center" />
                    <el-table-column prop="alarmLevel" label="报警等级" width="136" align="center" />
                    <el-table-column prop="productTime" label="产生时间" width="136" align="center" />
                    <el-table-column prop="endTime" label="结束时间" width="136" align="center" />
                    <el-table-column prop="alarmDate" label="报警日期" width="136" align="center" />
                </el-table>
                <div class="page">
                    <el-pagination v-model:currentPage="currentPage" v-model:page-size="pageSize" :small="true"
                        layout="total, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
                        @current-change="handleCurrentChange" />
                </div>
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
                            <!-- <span class="form-unit">Mpa</span> -->
                        </div>
                        <div class="form-item">
                            <label class="form-label">设备编号:</label>
                            <el-input v-model="settingsForm.name" placeholder="请输入设备编号" class="form-input"
                                @input="validateStringInput('name', $event)" />
                            <span class="form-unit"></span>
                        </div>
                        <div class="form-item">
                            <label class="form-label">寄存器地址:</label>
                            <el-input v-model="settingsForm.registerAddress" placeholder="请输入寄存器地址" class="form-input"
                                @input="validateNumberInput" />
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
                            <label class="form-label">上传图片:</label>
                            <div class="upload-demo">
                                <el-upload class="upload-demo" action="/fire-monitor/api/upload/image"
                                    :show-file-list="false" :before-upload="beforeUpload"
                                    :on-success="handleUploadSuccess" :on-error="handleUploadError" accept="image/*"
                                    name="file">
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
                    <div class="confirm-btn" @click="handleSettingsConfirm">
                        完成
                    </div>
                </div>
            </div>
        </el-dialog>

    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElTable, ElTableColumn, ElSelect, ElOption, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElUpload } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { API_CONFIG, buildUrl } from '../config/api'

// 导入图片资源
import userImg from '/static/index/user.png'
import passImg from '/static/index/pass.png'

const router = useRouter()

const toback = () => {
    router.push('/')
}

// 当前时间
const currentTime = ref('')
const value = ref('全部')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)

// 原始数据和过滤后的数据
const allAlarms = ref([])
const filteredAlarms = ref([])

// 表格显示的数据（分页后的数据）
const alarmData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredAlarms.value.slice(start, end).map((alarm, index) => ({
        id: String(start + index + 1).padStart(2, '0'),
        name: alarm.name || '',
        status: getAlarmStatusText(alarm.status, alarm.name),
        alarmLevel: getAlarmLevel(alarm.status),
        productTime: formatDateTime(alarm.alarmStartTime),
        endTime: formatDateTime(alarm.alarmEndTime),
        alarmDate: formatDate(alarm.alarmDate)
    }))
})
// 时间格式化函数
const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 报警等级映射函数
const getAlarmLevel = (alarmType) => {
    switch (alarmType) {
        case 'NORMAL':
            return '正常'
        case 'IN_USE':
        case 'WARNING':
            return '预警'
        case 'ALARM':
            return '报警'
        default:
            return '正常'
    }
}

// 状态映射函数（与首页getDeviceStatus保持一致）
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
}

// 告警状态映射函数（用于表格显示）
const getAlarmStatusText = (alarmType, deviceName) => {
    console.log('getAlarmStatusText called with:', { alarmType, deviceName })
    // 根据设备名称确定设备类型
    const isWaterHose = deviceName && deviceName.includes('消防水带')
    const isFireExtinguisher = deviceName && deviceName.includes('灭火器')
    const isFoamGun = deviceName && deviceName.includes('泡沫喷枪')
    const isBoxDoor = deviceName && deviceName.includes('箱体门')
    const isFoamLevel = deviceName && deviceName.includes('泡沫液位')
    const isWaterPressure = deviceName && deviceName.includes('水压监测')
    const isWaterGun = deviceName && deviceName.includes('消防水枪')

    // 箱体门的状态映射
    if (isBoxDoor) {
        switch (alarmType) {
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
        switch (alarmType) {
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
        switch (alarmType) {
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
        switch (alarmType) {
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
        switch (alarmType) {
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

    return ''
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

// 获取告警数据（仅获取一次，不启动轮询）
const fetchAlarmData = async () => {
    try {
        // 直接调用API获取数据，不启动轮询
        const response = await request.get(API_CONFIG.ENDPOINTS.MONITOR_STATUS)
        const data = response.data || { devices: [], alarms: [] }

        // 使用alarms数据作为告警数据
        console.log('接口返回的数据:', data)
        console.log('alarms数组:', data.alarms)
        allAlarms.value = data.alarms || []
        filteredAlarms.value = [...allAlarms.value]
        total.value = filteredAlarms.value.length
    } catch (error) {
        console.error('获取告警数据失败:', error)
        allAlarms.value = []
        filteredAlarms.value = []
        total.value = 0
    }
}

// 搜索功能
const handleSearch = () => {
    if (value.value === '全部' || value.value === '1') {
        filteredAlarms.value = [...allAlarms.value]
    } else {
        // 根据下拉框选择的设备类型过滤数据
        const selectedType = typelist.find(item => item.value === value.value)
        if (selectedType) {
            filteredAlarms.value = allAlarms.value.filter(alarm =>
                alarm.deviceName && alarm.deviceName.includes(selectedType.label.replace(/\d+$/, ''))
            )
        }
    }
    total.value = filteredAlarms.value.length
    currentPage.value = 1 // 重置到第一页
}

// 重置功能
const handleReset = () => {
    value.value = '全部'
    currentPage.value = 1
    fetchAlarmData() // 重新获取数据
}

// 分页处理
const handleSizeChange = (val) => {
    pageSize.value = val
    currentPage.value = 1
}

const handleCurrentChange = (val) => {
    currentPage.value = val
}

const typelist = [
    {
        value: '1',
        label: '全部',
    },
    {
        value: '2',
        label: '箱体门',
    },
    {
        value: '3',
        label: '泡沫液位',
    },
    {
        value: '4',
        label: '泡沫喷枪',
    },
    {
        value: '5',
        label: '灭火器',
    },
    {
        value: '6',
        label: '消防水枪',
    },
    {
        value: '7',
        label: '消防水带',
    },
    {
        value: '8',
        label: '水压监测',
    },
]

// 定时器
let timer = null

onMounted(() => {
    updateTime()
    timer = setInterval(updateTime, 1000)
    // 页面初始化时获取告警数据，只获取一次
    fetchAlarmData()
})

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
                    // 开发环境：使用test.junhekh.cn:8061拼接完整的服务器地址
                    displayPath = iconPath.startsWith('http') ? iconPath :
                        `http://test.junhekh.cn:8061${iconPath}`
                } else {
                    // 生产环境：使用127.0.0.1“8061拼接完整的服务器地址
                    displayPath = iconPath.startsWith('http') ? iconPath :
                        `http://127.0.0.1“8061${iconPath}`
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
            warningTimeThreshold: parseFloat(settingsForm.value.warningTimeThreshold) || 0,
            time: parseInt(settingsForm.value.time) || 0,
            name: String(settingsForm.value.name || '')
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
        // 转换为Map格式，然后转为普通对象发送
        const stationMap = new Map()
        stationMap.set('stationNumber', parseInt(settingsForm.value.stationNumber) || 1)
        const stationData = Object.fromEntries(stationMap)
        await request.post(API_CONFIG.ENDPOINTS.STATION, stationData)
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
    showSettingsDialog.value = false
}

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

// 退出应用
const handleExitOld = () => {
    if (window.electronAPI && window.electronAPI.closeApp) {
        window.electronAPI.closeApp()
    } else {
        // 如果不在electron环境中，关闭当前窗口
        window.close()
    }
}

// 清空登录表单
const clearLoginForm = () => {
    loginForm.value.username = ''
    loginForm.value.password = ''
}

// 清空设置表单
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

// 数字输入验证（允许数字和一个小数点）
const validateNumberInput = (event) => {
    const value = event.target.value
    const regex = /^\d*\.?\d*$/
    if (!regex.test(value)) {
        event.target.value = value.slice(0, -1)
    }
}

// 字符串输入验证（允许中文、英文、数字、空格、下划线、横线）
const validateStringInput = (event) => {
    const value = event.target.value
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9\s_-]*$/
    if (!regex.test(value)) {
        event.target.value = value.slice(0, -1)
    }
}

// 图片上传前的验证
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

// 图片上传成功处理
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
            // 生产环境：使用127.0.0.1“8061拼接完整的服务器地址
            settingsForm.value.uploadedImageUrl = response.path.startsWith('http') ?
                response.path : `http://127.0.0.1“8061${response.path}`
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

// 图片上传失败处理
const handleUploadError = (error) => {
    ElMessage.error('图片上传失败，请重试!')
    console.error('Upload error:', error)
}

onUnmounted(() => {
    if (timer) {
        clearInterval(timer)
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
            font-size: 9px;

            .control-icon {
                width: 14px;
                height: 14px;
            }
        }
    }
}

.toback {
    display: flex;
    margin: 11px 0 16px 20px;
    align-items: center;

    img {
        width: 14px;
        height: 14px;
    }

    .fanhui {
        cursor: pointer;
        font-family: 'Source Han Sans CN', sans-serif;
        font-size: 12px;
        color: #9AB5D6;
        margin-left: 10px;
        margin-bottom: 1px;
    }
}

.footer {
    margin: 0 20px;
    height: 481px;
    background: rgba(255, 255, 255, 0.07);

    .search {
        display: flex;
        align-items: center;
        color: #9AB5D6;
        margin: 16px 0 20px 16px;
        font-size: 12px;
        font-family: 'Source Han Sans CN', sans-serif;

        .cz {
            width: 68px;
            height: 31px;
            border-radius: 3px;
            border: 1px solid #536581;
            margin: 0 10px;
            margin-top: 2px !important;
            line-height: 29px;
            text-align: center;
            cursor: pointer;
        }

        .ss {
            width: 68px;
            height: 31px;
            border-radius: 3px;
            background: #095FB2;
            margin-top: 2px !important;
            line-height: 29px;
            text-align: center;
            cursor: pointer;
        }

        // 下拉框完整样式
        :deep(.elselect) {
            width: 193px !important;
            height: 29px !important;

            .el-select__wrapper {
                width: 193px !important;
                height: 29px !important;
                border: 1px solid #2175EB !important;
                border-radius: 0 !important;
                background: rgba(0, 0, 0, 0.24) !important;
                box-shadow: none !important;
                display: flex !important;
                align-items: center !important;

                .el-select__placeholder {
                    color: #9AB5D6 !important;
                    font-size: 12px !important;
                    line-height: 1 !important;
                }

                .el-select__selected-item {
                    color: #9AB5D6 !important;
                    font-size: 12px !important;
                    line-height: 1 !important;
                }

                .el-select__input {
                    color: #9AB5D6 !important;
                    font-size: 12px !important;
                    line-height: 1 !important;
                }

                .el-select__suffix {
                    color: #9AB5D6 !important;
                }
            }
        }
    }

    .tables {
        margin: 0 16px;

        :deep(.el-table) {
            height: auto !important;
            background: transparent;
            color: #fff;
            font-size: 12px;
            --el-table-border-color: none !important;
            max-height: 370px !important;
        }

        :deep(.el-table th.el-table__cell) {
            background: #1C5082 !important;
            color: #fff !important;
            // border-bottom: 1px solid #32A4F1;
            font-size: 12px !important;
            height: 40px !important;
        }

        :deep(.el-table td.el-table__cell) {
            background: #0F2D54 !important;
            color: #fff !important;
            border-bottom: 1px solid rgba(50, 164, 241, 0.3);
            font-size: 12px !important;
            height: 32px !important;
        }

        :deep(.el-table--border) {
            // border: 1px solid #32A4F1;
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
    }

    .page {
        display: flex;
        justify-self: end;
        margin-top: 18px;

        :deep(.el-pagination__total) {
            color: #9AB5D6 !important;
            font-size: 10px;
        }

        :deep(.el-pager) {
            gap: 6px !important;
        }

        :deep(li.is-active) {
            font-weight: normal;
            color: #9AB5D6 !important;
            border: 1px solid #9AB5D6 !important;
            font-size: 10px;
        }

        :deep(.el-pager li) {
            background: rgba(170, 170, 170, 0.15);
            color: #9AB5D6;
            border-radius: 2px;
            font-size: 10px;
        }

        :deep(.btn-prev) {
            background: rgba(170, 170, 170, 0.15);
            color: #9AB5D6;
            border-radius: 2px;
            margin-right: 6px;
        }

        :deep(.btn-next) {
            background: rgba(170, 170, 170, 0.15);
            color: #9AB5D6;
            font-size: 10px;
            border-radius: 2px;
            margin-left: 6px;
        }

        :deep(.el-pagination__goto) {
            color: #9AB5D6 !important;
            font-size: 10px;
        }

        :deep(.el-pagination__editor.el-input) {
            width: 36px !important;
            border-radius: 2px;
            color: #9AB5D6;
            font-size: 10px;
            font-family: PingFang SC, PingFang SC;
            border: none !important;
            box-shadow: none !important;
            background-color: #343E55 !important;
        }

        :deep(.el-input--small .el-input__wrapper) {
            background-color: #343E55;
            border: none !important;
            box-shadow: none !important;
        }

        :deep(.el-pagination .el-input__inner) {
            color: #9AB5D6 !important;
            border-radius: 2px;
            background-color: #343E55 !important;
            border: none !important;
            box-shadow: none !important;
        }

        :deep(.el-input__wrapper.is-focus) {
            color: #9AB5D6 !important;
            border: 1px solid #9AB5D6 !important;
            border: none !important;
            box-shadow: none !important;
        }

        :deep(.el-pagination__classifier) {
            color: #9AB5D6;
            font-size: 10px;
            font-family: PingFang SC, PingFang SC;
        }
    }
}

/* 登录弹窗样式 */
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
                border: 1px solid #2175EB;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
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
                        font-size: 12px;
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

<!-- 下拉框专用样式 -->
<style lang="scss">
.custom-select-dropdown {
    background: #1C5082 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;

    .el-select-dropdown__wrap {
        background: #1C5082 !important;
        max-height: 274px !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
    }

    .el-select-dropdown__list {
        background: #1C5082 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
    }

    .el-select-dropdown__item {
        background: #1C5082 !important;
        color: #9AB5D6 !important;
        font-size: 12px !important;
        padding: 0 12px !important;
        margin: 0 !important;
        height: 32px !important;
        line-height: 32px !important;
        border: none !important;
        display: flex !important;
        align-items: center !important;
        box-sizing: border-box !important;

        &:hover,
        &.is-hovering,
        &:focus {
            background: #345E96 !important;
            color: #9AB5D6 !important;
        }

        &.is-selected {
            background: #345E96 !important;
            color: #9AB5D6 !important;
        }
    }

    .el-scrollbar {
        background: #1C5082 !important;
        width: 100% !important;
    }

    .el-scrollbar__wrap {
        background: #1C5082 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
    }

    .el-scrollbar__view {
        background: #1C5082 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
    }

    .el-scrollbar__bar {
        background: transparent !important;

        &.is-vertical {
            right: 0 !important;
            width: 6px !important;
        }

        .el-scrollbar__thumb {
            background: #345E96 !important;
            border-radius: 0 !important;
        }
    }

    .el-select-dropdown__empty {
        background: #1C5082 !important;
        color: #9AB5D6 !important;
        padding: 0 12px !important;
        margin: 0 !important;
        border: none !important;
    }

    .el-popper__arrow,
    .el-popper__arrow::before,
    .el-popper__arrow::after {
        display: none !important;
        visibility: hidden !important;
    }
}
</style>