// API配置文件
export const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'production' ? '127.0.0.1:8061' : '',
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
        // 视频流获取接口
        VIDEO_STREAM: '/fire-monitor/api/stream'
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