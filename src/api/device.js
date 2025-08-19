import { defineStore } from 'pinia'
import request from '../utils/request'
import { API_CONFIG } from '../config/api'

export const useDeviceStore = defineStore('device', {
    state: () => ({
        devices: [],
        alarms: [],
        isPolling: false,
        pollingInterval: null
    }),

    getters: {
        getDeviceById: (state) => (id) => {
            return state.devices.find(device => device.id === id)
        },
        getActiveAlarms: (state) => {
            return state.alarms.filter(alarm => alarm.status === 'active')
        },
        getDevicesByStatus: (state) => (status) => {
            return state.devices.filter(device => device.currentStatus === status)
        }
    },

    actions: {
        // 获取监控状态数据
        async fetchMonitorStatus() {
            try {
                console.log('获取真实设备状态数据')

                // 调用真实的监控状态接口
                const response = await request.get(API_CONFIG.ENDPOINTS.MONITOR_STATUS)
                const data = response.data || { devices: [], alarms: [] }

                console.log('设备状态数据:', data)
                this.devices = data.devices || []
                this.alarms = data.alarms || []
                return data
            } catch (error) {
                console.error('获取监控状态失败:', error)
                // 发生错误时使用空数组，避免页面崩溃
                this.devices = []
                this.alarms = []
                throw error
            }
        },

        // 开始轮询
        startPolling() {
            if (this.isPolling) return

            this.isPolling = true
            // 立即执行一次
            this.fetchMonitorStatus()

            // 每1秒轮询一次
            // this.pollingInterval = setInterval(() => {
            //     this.fetchMonitorStatus()
            // }, 1000)
        },

        // 停止轮询
        stopPolling() {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval)
                this.pollingInterval = null
            }
            this.isPolling = false
        }
    }
})