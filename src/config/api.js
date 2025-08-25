// API配置文件
// 支持多个API地址配置
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境：优先使用环境变量，否则使用默认的192.168.1.200
    return process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8061'
  } else {
    // 开发环境使用相对路径，通过Vite代理转发
    return ''
  }
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    // 设备参数相关
    THRESHOLDS: '/fire-monitor/api/config/thresholds',
    STATION: '/fire-monitor/api/config/station',
    // 密码验证
    PASSWORD_CHECK: '/fire-monitor/api/pwd/check',
    // 监控状态
    MONITOR_STATUS: '/fire-monitor/api/monitor/status',
    // 自定义设备信息
    CUSTOM_DEVICE_INFO: '/fire-monitor/api/custom-device/info',
    CUSTOM_DEVICE_SAVE: '/fire-monitor/api/custom-device/save',
    // 推流视频rtspUrl - 支持index参数（0:左侧，1:右侧）
    VIDEO_camera: '/fire-monitor/api/camera/rtsp',
    // 推流视频的地址
    VIDEO_start: '/fire-monitor/api/stream/start'
  }
}

// 构建完整URL的辅助函数
export const buildUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`

  // 如果有查询参数，添加到URL中
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }
  return url
}

// 构建视频摄像头RTSP URL的辅助函数
// index: 0-左侧区域, 1-右侧区域
export const buildCameraUrl = (index) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEO_camera}/${index}`
}

// 视频流使用说明：
// 1. 先调用 buildCameraUrl(index) 获取RTSP URL，传入cameraId参数
// 2. 再调用 VIDEO_start 接口，传入cameraId和第一步获取的rtspUrl
// 3. 获取streamUrl用于播放实时监控