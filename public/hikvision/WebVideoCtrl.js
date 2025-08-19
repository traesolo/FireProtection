/**
 * 海康Web SDK模拟版本
 * 提供真实的视频播放效果和完整的API接口
 */

// 全局WebVideoCtrl对象
window.WebVideoCtrl = {
    // SDK状态
    _initialized: false,
    _sessions: new Map(),
    _players: new Map(),
    _currentSessionId: 1000,
    _currentPlayerId: 2000,

    // 初始化SDK
    I_InitPlugin: function(width, height, options = {}) {
        console.log('初始化海康Web SDK', { width, height, options });
        
        // 模拟初始化延迟
        return new Promise((resolve) => {
            setTimeout(() => {
                this._initialized = true;
                console.log('海康Web SDK初始化成功');
                resolve(0); // 成功返回0
            }, 500);
        });
    },

    // 登录设备
    I_Login: function(ip, port, username, password, callbacks = {}) {
        console.log('尝试登录海康设备', { ip, port, username });
        
        return new Promise((resolve) => {
            // 模拟网络延迟
            setTimeout(() => {
                // 模拟登录验证
                if (username === 'admin' && password === 'qwe13579') {
                    const sessionId = this._currentSessionId++;
                    this._sessions.set(sessionId, {
                        ip,
                        port,
                        username,
                        loginTime: new Date(),
                        connected: true
                    });
                    
                    console.log('海康设备登录成功，会话ID:', sessionId);
                    
                    if (callbacks.success) {
                        callbacks.success(sessionId);
                    }
                    
                    resolve({
                        success: true,
                        sessionId: sessionId
                    });
                } else {
                    const error = '用户名或密码错误';
                    console.error('海康设备登录失败:', error);
                    
                    if (callbacks.error) {
                        callbacks.error(error);
                    }
                    
                    resolve({
                        success: false,
                        error: error
                    });
                }
            }, 1000);
        });
    },

    // 开始实时预览
    I_StartRealPlay: function(sessionId, options = {}) {
        console.log('开始实时预览', { sessionId, options });
        
        return new Promise((resolve) => {
            if (!this._sessions.has(sessionId)) {
                const error = '无效的会话ID';
                console.error(error);
                resolve({
                    success: false,
                    error: error
                });
                return;
            }

            // 模拟启动延迟
            setTimeout(() => {
                const playerId = this._currentPlayerId++;
                const session = this._sessions.get(sessionId);
                
                this._players.set(playerId, {
                    sessionId,
                    options,
                    startTime: new Date(),
                    playing: true
                });

                // 创建模拟视频内容
                this._createVideoPlayer(options.szDeviceIdentify, session.ip, options.iChannelID || 1);
                
                console.log('海康设备预览开始成功，播放ID:', playerId);
                
                resolve({
                    success: true,
                    playHandle: playerId
                });
            }, 800);
        });
    },

    // 停止实时预览
    I_StopRealPlay: function(playerId) {
        console.log('停止实时预览', playerId);
        
        if (this._players.has(playerId)) {
            this._players.delete(playerId);
            console.log('预览停止成功');
            return 0;
        }
        
        console.warn('无效的播放ID:', playerId);
        return -1;
    },

    // 登出设备
    I_Logout: function(sessionId) {
        console.log('登出海康设备', sessionId);
        
        if (this._sessions.has(sessionId)) {
            // 停止所有相关的播放
            for (let [playerId, player] of this._players) {
                if (player.sessionId === sessionId) {
                    this.I_StopRealPlay(playerId);
                }
            }
            
            this._sessions.delete(sessionId);
            console.log('设备登出成功');
            return 0;
        }
        
        console.warn('无效的会话ID:', sessionId);
        return -1;
    },

    // 反初始化SDK
    I_Uninit: function() {
        console.log('反初始化海康Web SDK');
        
        // 清理所有连接
        this._players.clear();
        this._sessions.clear();
        this._initialized = false;
        
        return 0;
    },

    // 创建模拟视频播放器
    _createVideoPlayer: function(containerId, deviceIp, channelId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('找不到视频容器:', containerId);
            return;
        }

        // 清空容器
        container.innerHTML = '';
        
        // 创建视频播放界面
        const videoWrapper = document.createElement('div');
        videoWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #1a1a2e, #16213e);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // 创建模拟视频内容
        const videoContent = document.createElement('div');
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
        `;

        // 设备信息显示
        const deviceInfo = document.createElement('div');
        deviceInfo.style.cssText = `
            color: #00ff88;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 0 10px #00ff88;
            font-family: 'Courier New', monospace;
        `;
        deviceInfo.textContent = `海康威视 DS-2CD2xxx`;

        // 连接信息
        const connectionInfo = document.createElement('div');
        connectionInfo.style.cssText = `
            color: #00aaff;
            font-size: 12px;
            margin-bottom: 20px;
            opacity: 0.9;
        `;
        connectionInfo.textContent = `${deviceIp} - 通道${channelId} - 实时监控`;

        // 状态指示器
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            width: 12px;
            height: 12px;
            background: #00ff88;
            border-radius: 50%;
            margin-bottom: 15px;
            box-shadow: 0 0 15px #00ff88;
            animation: pulse 2s infinite;
        `;

        // 模拟数据流
        const dataStream = document.createElement('div');
        dataStream.style.cssText = `
            color: #666;
            font-size: 10px;
            font-family: 'Courier New', monospace;
            line-height: 1.2;
            text-align: center;
            opacity: 0.7;
        `;
        
        // 添加CSS动画
        const style = document.createElement('style');
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
        `;
        document.head.appendChild(style);

        // 组装界面
        videoContent.appendChild(deviceInfo);
        videoContent.appendChild(connectionInfo);
        videoContent.appendChild(statusIndicator);
        videoContent.appendChild(dataStream);
        videoWrapper.appendChild(videoContent);
        container.appendChild(videoWrapper);

        // 模拟实时数据更新
        let frameCount = 0;
        const updateData = () => {
            frameCount++;
            const timestamp = new Date().toLocaleTimeString();
            const fps = Math.floor(Math.random() * 3) + 28; // 28-30 FPS
            const bitrate = Math.floor(Math.random() * 200) + 800; // 800-1000 kbps
            
            dataStream.innerHTML = `
                时间: ${timestamp}<br>
                帧数: ${frameCount}<br>
                帧率: ${fps} FPS<br>
                码率: ${bitrate} kbps<br>
                分辨率: 1280x720
            `;
            
            dataStream.style.animation = 'dataFlow 1s ease-in-out';
        };

        // 每秒更新一次数据
        const updateInterval = setInterval(updateData, 1000);
        updateData(); // 立即更新一次

        // 存储清理函数
        container._cleanup = () => {
            clearInterval(updateInterval);
        };

        console.log('模拟视频播放器创建成功:', containerId);
    }
};

// 确保SDK在页面加载完成后可用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('海康Web SDK模拟版本已加载');
    });
} else {
    console.log('海康Web SDK模拟版本已加载');
}