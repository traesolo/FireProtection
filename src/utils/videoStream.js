/**
 * 视频流处理工具类
 * 处理监控摄像头的RTSP视频流
 */

export class VideoStreamManager {
    constructor() {
        this.streams = new Map() // 存储活跃的视频流
        this.isElectron = window.electronAPI !== undefined
    }

    /**
     * 开始视频流
     * @param {Object} config - 摄像头配置
     * @param {string} config.id - 摄像头ID
     * @param {string} config.ip - 摄像头IP地址
     * @param {number} config.port - 摄像头端口
     * @param {string} config.username - 用户名
     * @param {string} config.password - 密码
     * @param {number} config.channel - 通道号
     * @param {string} config.containerId - 视频容器DOM ID
     */
    async startStream(config) {
        try {
            console.log('开始启动视频流:', config)

            if (this.streams.has(config.id)) {
                console.warn('视频流已存在:', config.id)
                return { success: false, message: '视频流已存在' }
            }

            // 构建RTSP URL
            const rtspUrl = this.buildRTSPUrl(config)
            console.log('RTSP URL:', rtspUrl)

            if (this.isElectron) {
                // Electron环境：使用FFmpeg处理RTSP流
                const result = await window.electronAPI.videoStream.start({
                    id: config.id,
                    rtspUrl: rtspUrl,
                    containerId: config.containerId
                })

                if (result.success) {
                    this.streams.set(config.id, {
                        config,
                        rtspUrl,
                        hlsUrl: result.hlsUrl,
                        startTime: new Date(),
                        status: 'running'
                    })
                    console.log('视频流启动成功:', config.id, 'HLS URL:', result.hlsUrl)
                    return { success: true, streamId: config.id, hlsUrl: result.hlsUrl }
                } else {
                    console.error('视频流启动失败:', result.error)
                    return { success: false, message: result.error }
                }
            } else {
                // 浏览器环境：使用模拟视频流
                const mockHlsUrl = `http://localhost:8080/hls/${config.id}.m3u8`
                this.createMockVideoStream(config)
                this.streams.set(config.id, {
                    config,
                    rtspUrl,
                    hlsUrl: mockHlsUrl,
                    startTime: new Date(),
                    status: 'running'
                })
                console.log('浏览器环境模拟视频流启动:', config.id, 'Mock HLS URL:', mockHlsUrl)
                return { success: true, streamId: config.id, hlsUrl: mockHlsUrl }
            }
        } catch (error) {
            console.error('启动视频流异常:', error)
            return { success: false, message: error.message }
        }
    }

    /**
     * 停止视频流
     * @param {string} streamId - 视频流ID
     */
    async stopStream(streamId) {
        try {
            console.log('停止视频流:', streamId)

            if (!this.streams.has(streamId)) {
                console.warn('视频流不存在:', streamId)
                return { success: false, message: '视频流不存在' }
            }

            if (this.isElectron) {
                // Electron环境：停止FFmpeg进程
                const result = await window.electronAPI.videoStream.stop(streamId)
                if (result.success) {
                    this.streams.delete(streamId)
                    console.log('视频流停止成功:', streamId)
                    return { success: true }
                } else {
                    console.error('视频流停止失败:', result.error)
                    return { success: false, message: result.error }
                }
            } else {
                // 浏览器环境：清理模拟视频流
                this.clearMockVideoStream(streamId)
                this.streams.delete(streamId)
                return { success: true }
            }
        } catch (error) {
            console.error('停止视频流异常:', error)
            return { success: false, message: error.message }
        }
    }

    /**
     * 获取视频流状态
     * @param {string} streamId - 视频流ID
     */
    async getStreamStatus(streamId) {
        if (!this.streams.has(streamId)) {
            return { exists: false }
        }

        const stream = this.streams.get(streamId)

        if (this.isElectron) {
            // 从Electron主进程获取实时状态
            const status = await window.electronAPI.videoStream.getStatus(streamId)
            return {
                exists: true,
                ...stream,
                ...status
            }
        } else {
            // 浏览器环境返回基本状态
            return {
                exists: true,
                ...stream
            }
        }
    }

    /**
     * 获取所有活跃的视频流
     */
    getAllStreams() {
        return Array.from(this.streams.entries()).map(([id, stream]) => ({
            id,
            ...stream
        }))
    }

    /**
     * 构建RTSP URL
     * @param {Object} config - 摄像头配置
     */
    buildRTSPUrl(config) {
        const { ip, port = 554, username, password, channel = 1 } = config

        // 海康威视RTSP URL格式
        if (username && password) {
            return `rtsp://${username}:${password}@${ip}:${port}/Streaming/Channels/${channel}01`
        } else {
            return `rtsp://${ip}:${port}/Streaming/Channels/${channel}01`
        }
    }

    /**
     * 创建模拟视频流（浏览器环境）
     * @param {Object} config - 摄像头配置
     */
    createMockVideoStream(config) {
        // 添加重试机制，确保DOM元素存在
        const findContainer = () => {
            return document.getElementById(config.containerId)
        }

        let container = findContainer()
        if (!container) {
            console.warn('视频容器暂时未找到，等待DOM渲染:', config.containerId)
            // 等待一段时间后重试
            setTimeout(() => {
                container = findContainer()
                if (!container) {
                    console.error('找不到视频容器:', config.containerId)
                    return
                }
                this.createVideoContent(container, config)
            }, 200)
            return
        }

        this.createVideoContent(container, config)
    }

    createVideoContent(container, config) {
        try {
            // 清空容器
            container.innerHTML = ''

            // 创建模拟视频界面
            const videoWrapper = document.createElement('div')
            videoWrapper.className = 'video-stream-wrapper'
            videoWrapper.style.cssText = `
            width: 486px;
            height: 277px;
            background: linear-gradient(45deg, #1a1a2e, #16213e);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        `

            // 创建视频内容区域
            const videoContent = document.createElement('div')
            videoContent.style.cssText = `
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 30% 30%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, rgba(0, 136, 255, 0.1) 0%, transparent 50%),
                linear-gradient(135deg, #0f1419 0%, #1a1a2e 50%, #16213e 100%);
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `

            // 摄像头信息
            const cameraInfo = document.createElement('div')
            cameraInfo.style.cssText = `
            color: #00ff88;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 0 0 8px #00ff88;
            font-family: 'Courier New', monospace;
        `
            cameraInfo.textContent = `监控摄像头 ${config.id}`

            // 连接信息
            const connectionInfo = document.createElement('div')
            connectionInfo.style.cssText = `
            color: #00aaff;
            font-size: 10px;
            margin-bottom: 15px;
            opacity: 0.9;
        `
            connectionInfo.textContent = `${config.ip}:${config.port || 554} - 通道${config.channel || 1}`

            // 状态指示器
            const statusIndicator = document.createElement('div')
            statusIndicator.style.cssText = `
            width: 10px;
            height: 10px;
            background: #00ff88;
            border-radius: 50%;
            margin-bottom: 12px;
            box-shadow: 0 0 12px #00ff88;
            animation: pulse 2s infinite;
        `

            // 实时数据
            const dataStream = document.createElement('div')
            dataStream.style.cssText = `
            color: #666;
            font-size: 9px;
            font-family: 'Courier New', monospace;
            line-height: 1.1;
            text-align: center;
            opacity: 0.7;
        `

            // 添加CSS动画
            if (!document.getElementById('video-stream-styles')) {
                const style = document.createElement('style')
                style.id = 'video-stream-styles'
                style.textContent = `
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes dataFlow {
                    0% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.3; }
                }
            `
                document.head.appendChild(style)
            }

            // 组装界面
            videoContent.appendChild(cameraInfo)
            videoContent.appendChild(connectionInfo)
            videoContent.appendChild(statusIndicator)
            videoContent.appendChild(dataStream)
            videoWrapper.appendChild(videoContent)
            container.appendChild(videoWrapper)

            // 模拟实时数据更新
            let frameCount = 0
            const updateData = () => {
                frameCount++
                const timestamp = new Date().toLocaleTimeString()
                const fps = Math.floor(Math.random() * 3) + 28 // 28-30 FPS
                const bitrate = Math.floor(Math.random() * 200) + 800 // 800-1000 kbps

                dataStream.innerHTML = `
                时间: ${timestamp}<br>
                帧数: ${frameCount}<br>
                帧率: ${fps} FPS<br>
                码率: ${bitrate} kbps<br>
                分辨率: 1280x720
            `

                dataStream.style.animation = 'dataFlow 1s ease-in-out'
            }

            // 每秒更新一次数据
            const updateInterval = setInterval(updateData, 1000)
            updateData() // 立即更新一次

            // 存储清理函数
            container._cleanup = () => {
                clearInterval(updateInterval)
            }

            console.log('模拟视频流创建成功:', config.id)
        } catch (error) {
            console.error('创建模拟视频流失败:', error)
            // 显示错误信息
            if (container) {
                container.innerHTML = `<div class="monitor-placeholder" style="color: #ff6b6b;">视频流创建失败: ${error.message}</div>`
            }
        }
    }

    /**
     * 清理模拟视频流
     * @param {string} streamId - 视频流ID
     */
    clearMockVideoStream(streamId) {
        const stream = this.streams.get(streamId)
        if (stream && stream.config.containerId) {
            const container = document.getElementById(stream.config.containerId)
            if (container && container._cleanup) {
                container._cleanup()
                container.innerHTML = '<div class="monitor-placeholder">监控区域</div>'
            }
        }
    }

    /**
     * 停止所有视频流
     */
    async stopAllStreams() {
        const streamIds = Array.from(this.streams.keys())
        const results = await Promise.all(
            streamIds.map(id => this.stopStream(id))
        )
        return results
    }
}

// 创建全局实例
export const videoStreamManager = new VideoStreamManager()