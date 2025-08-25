// 模拟设备数据 - 用于测试视频播放功能

// 模拟设备状态数据
export const mockDeviceData = {
  devices: [
    {
      id: 'fireExtinguisher1',
      name: '灭火器1',
      currentStatus: 'IN_USE', // 激活状态，触发视频播放
      icon: '/static/icons/miehuoqi.png',
      lastStatusChangeTime: new Date().toISOString()
    },
    {
      id: 'fireExtinguisher2', 
      name: '灭火器2',
      currentStatus: 'NORMAL', // 正常状态
      icon: '/static/icons/miehuoqi.png',
      lastStatusChangeTime: new Date().toISOString()
    },
    {
      id: 'waterGun1',
      name: '消防水枪1',
      currentStatus: 'IN_USE', // 激活状态，触发视频播放
      icon: '/static/icons/shuiqiang.png',
      lastStatusChangeTime: new Date().toISOString()
    },
    {
      id: 'waterHose1',
      name: '消防水带1', 
      currentStatus: 'NORMAL', // 正常状态
      icon: '/static/icons/shuiqiang.png',
      lastStatusChangeTime: new Date().toISOString()
    },
    {
      id: 'foamGun1',
      name: '泡沫喷枪1',
      currentStatus: 'IN_USE', // 激活状态，触发视频播放
      icon: '/static/icons/paomoqiang.png',
      lastStatusChangeTime: new Date().toISOString()
    },
    {
      id: 'boxDoor1',
      name: '箱体门1',
      currentStatus: 'NORMAL',
      icon: '/static/icons/men.png',
      lastStatusChangeTime: new Date().toISOString()
    },
    {
      id: 'liquidLevel1',
      name: '泡沫液位1',
      currentStatus: 'NORMAL',
      icon: '/static/icons/paomo.png',
      lastStatusChangeTime: new Date().toISOString()
    },
    {
      id: 'waterPressure1',
      name: '水压监测1',
      currentStatus: 'NORMAL',
      icon: '/static/icons/shuiyajianche.png',
      lastStatusChangeTime: new Date().toISOString()
    }
  ],
  alarms: [
    {
      id: 'alarm1',
      name: '灭火器1',
      status: 'IN_USE',
      alarmStartTime: new Date().toISOString(),
      alarmEndTime: null
    },
    {
      id: 'alarm2', 
      name: '消防水枪1',
      status: 'IN_USE',
      alarmStartTime: new Date().toISOString(),
      alarmEndTime: null
    },
    {
      id: 'alarm3',
      name: '泡沫喷枪1', 
      status: 'IN_USE',
      alarmStartTime: new Date().toISOString(),
      alarmEndTime: null
    }
  ]
}

// 切换设备状态的辅助函数
export const toggleDeviceStatus = (deviceId, newStatus = 'IN_USE') => {
  const device = mockDeviceData.devices.find(d => d.id === deviceId)
  if (device) {
    device.currentStatus = newStatus
    device.lastStatusChangeTime = new Date().toISOString()
    console.log(`设备 ${device.name} 状态已切换为: ${newStatus}`)
  }
}

// 重置所有设备状态为正常
export const resetAllDevices = () => {
  mockDeviceData.devices.forEach(device => {
    device.currentStatus = 'NORMAL'
    device.lastStatusChangeTime = new Date().toISOString()
  })
  mockDeviceData.alarms = []
  console.log('所有设备状态已重置为正常')
}

// 激活测试场景：灭火器、消防水枪、泡沫喷枪同时激活
export const activateTestScenario = () => {
  toggleDeviceStatus('fireExtinguisher1', 'IN_USE')
  toggleDeviceStatus('waterGun1', 'IN_USE') 
  toggleDeviceStatus('foamGun1', 'IN_USE')
  
  // 更新告警数据
  mockDeviceData.alarms = [
    {
      id: 'alarm1',
      name: '灭火器1',
      status: 'IN_USE',
      alarmStartTime: new Date().toISOString(),
      alarmEndTime: null
    },
    {
      id: 'alarm2',
      name: '消防水枪1',
      status: 'IN_USE', 
      alarmStartTime: new Date().toISOString(),
      alarmEndTime: null
    },
    {
      id: 'alarm3',
      name: '泡沫喷枪1',
      status: 'IN_USE',
      alarmStartTime: new Date().toISOString(),
      alarmEndTime: null
    }
  ]
  
  console.log('测试场景已激活：灭火器1、消防水枪1、泡沫喷枪1 状态为 IN_USE')
  return mockDeviceData
}