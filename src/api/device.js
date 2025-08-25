import { defineStore } from 'pinia'
import request from '../utils/request'
import { API_CONFIG } from '../config/api'
import { mockDeviceData, activateTestScenario } from '../utils/mockData'

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
        console.log('设备列表详情:', data.devices)
        if (data.devices && data.devices.length > 0) {
          console.log('设备名称列表:', data.devices.map(d => d.name))
          console.log('设备ID列表:', data.devices.map(d => d.id))
        }
        this.devices = data.devices || []
        this.alarms = data.alarms || []
        return data
      } catch (error) {
        console.error('获取监控状态失败:', error)
        
        // API连接失败时，清空数据
        this.devices = []
        this.alarms = []
        throw error
      }
    },

    // 手动切换到模拟数据模式（用于测试）
    useMockData() {
      console.log('手动切换到模拟数据模式')
      const mockData = activateTestScenario()
      this.devices = mockData.devices
      this.alarms = mockData.alarms
      console.log('当前激活的设备:', mockData.devices.filter(d => d.currentStatus === 'IN_USE').map(d => d.name))
      return mockData
    },

    // 开始轮询
    startPolling() {
      if (this.isPolling) return

      this.isPolling = true
      // 立即执行一次
      this.fetchMonitorStatus()

      // 每1秒轮询一次
      this.pollingInterval = setInterval(() => {
        this.fetchMonitorStatus()
      }, 1000)
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