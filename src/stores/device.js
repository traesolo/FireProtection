import { defineStore } from 'pinia'
import { ref } from 'vue'

export const deviceStore = defineStore('device', () => {
  const devices = ref([])
  const alarms = ref([])
  const isConnected = ref(false)
  
  const updateDevices = (newDevices) => {
    devices.value = newDevices
  }
  
  const updateAlarms = (newAlarms) => {
    alarms.value = newAlarms
  }
  
  const setConnectionStatus = (status) => {
    isConnected.value = status
  }
  
  return {
    devices,
    alarms,
    isConnected,
    updateDevices,
    updateAlarms,
    setConnectionStatus
  }
})