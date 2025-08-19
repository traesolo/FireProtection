const { app, BrowserWindow, globalShortcut, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const http = require('http')
const express = require('express')

// 针对4核2G硬件的性能优化
app.commandLine.appendSwitch('--max-old-space-size', '1024') // 限制V8内存使用为1GB
app.commandLine.appendSwitch('--memory-pressure-off') // 关闭内存压力检测
app.commandLine.appendSwitch('--max-http-cache-size', '0') // 禁用HTTP缓存
app.commandLine.appendSwitch('--disable-background-timer-throttling') // 禁用后台定时器节流
app.commandLine.appendSwitch('--disable-renderer-backgrounding') // 禁用渲染器后台化
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows') // 禁用被遮挡窗口的后台化
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor') // 禁用某些GPU特性以减少内存使用

// 视频流管理
const videoStreams = new Map() // 存储活跃的视频流
let hlsServer = null // HLS服务器实例
const HLS_PORT = 8080 // HLS服务器端口
const HLS_DIR = path.join(__dirname, '../hls') // HLS文件目录

// FFmpeg路径检测
function findFFmpegPath() {
    const platform = process.platform
    const ffmpegDir = path.join(__dirname, '../ffmpeg')
    
    console.log('检测FFmpeg路径，平台:', platform)
    console.log('FFmpeg目录:', ffmpegDir)
    
    let ffmpegPath
    
    if (platform === 'win32') {
        // Windows平台
        ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.1.1-essentials_build', 'bin', 'ffmpeg.exe')
    } else if (platform === 'linux') {
        // Linux平台
        ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg')
    } else if (platform === 'darwin') {
        // macOS平台（如果需要的话）
        ffmpegPath = path.join(ffmpegDir, 'ffmpeg')
    } else {
        console.error('不支持的平台:', platform)
        return null
    }
    
    console.log('FFmpeg路径:', ffmpegPath)
    
    // 检查文件是否存在
    if (fs.existsSync(ffmpegPath)) {
        console.log('FFmpeg找到:', ffmpegPath)
        return ffmpegPath
    } else {
        console.error('FFmpeg未找到:', ffmpegPath)
        return null
    }
}

// 初始化HLS目录
function initHLSDirectory() {
    try {
        if (!fs.existsSync(HLS_DIR)) {
            fs.mkdirSync(HLS_DIR, { recursive: true })
            console.log('HLS目录创建成功:', HLS_DIR)
        } else {
            // 清理旧的HLS文件
            const files = fs.readdirSync(HLS_DIR)
            files.forEach(file => {
                if (file.endsWith('.m3u8') || file.endsWith('.ts')) {
                    fs.unlinkSync(path.join(HLS_DIR, file))
                }
            })
            console.log('HLS目录清理完成')
        }
    } catch (error) {
        console.error('初始化HLS目录失败:', error)
    }
}

// 启动HLS服务器
function startHLSServer() {
    try {
        const app = express()
        
        // 设置CORS头
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
            next()
        })
        
        // 提供HLS文件服务
        app.use('/hls', express.static(HLS_DIR))
        
        // 健康检查端点
        app.get('/health', (req, res) => {
            res.json({ status: 'ok', streams: videoStreams.size })
        })
        
        hlsServer = http.createServer(app)
        hlsServer.listen(HLS_PORT, () => {
            console.log(`HLS服务器启动成功，端口: ${HLS_PORT}`)
        })
        
        hlsServer.on('error', (error) => {
            console.error('HLS服务器错误:', error)
        })
        
    } catch (error) {
        console.error('启动HLS服务器失败:', error)
    }
}

// 更可靠的开发环境检测
// 强制生产模式检测，避免误判
// 只有在明确的开发环境下才为true，避免开机自启动时误判
const isDev = (process.env.NODE_ENV === 'development' || 
              process.env.IS_DEV === 'true') && 
              !app.isPackaged
console.log('=== 环境检测详情 ===')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('isPackaged:', app.isPackaged)
console.log('process.argv:', process.argv)
console.log('__dirname:', __dirname)
console.log('计算后的isDev:', isDev)
console.log('=====================')

let mainWindow











function createWindow() {
    const windowConfig = {
        width: isDev ? 1200 : 1920,
        height: isDev ? 800 : 1080,
        fullscreen: !isDev,
        frame: isDev,
        kiosk: !isDev,
        alwaysOnTop: !isDev,
        skipTaskbar: !isDev,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: true, // 始终启用web安全检查
            allowRunningInsecureContent: false, // 禁止运行不安全内容
            // 4核2G硬件优化配置
            backgroundThrottling: false, // 禁用后台节流
            offscreen: false, // 禁用离屏渲染
            experimentalFeatures: false, // 禁用实验性功能
            plugins: false, // 禁用插件
            webgl: false, // 禁用WebGL以节省GPU内存
            nodeIntegrationInWorker: false, // 禁用Worker中的Node集成
            nodeIntegrationInSubFrames: false, // 禁用子框架中的Node集成
            spellcheck: false, // 禁用拼写检查
            enableWebSQL: false // 禁用WebSQL
        },
        show: false
    }

    console.log('窗口配置:', windowConfig)
    mainWindow = new BrowserWindow(windowConfig)

    const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(app.getAppPath(), 'dist/index.html')}`

    console.log('加载URL:', startUrl)
    mainWindow.loadURL(startUrl)

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
        mainWindow.focus()

        if (isDev) {
            mainWindow.webContents.openDevTools()
        }
    })

    // 错误处理
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('页面加载失败:', {
            errorCode,
            errorDescription,
            validatedURL
        })
    })

    mainWindow.webContents.on('dom-ready', () => {
        console.log('DOM加载完成')
    })

    // 开发模式显示菜单栏
    mainWindow.setMenuBarVisibility(isDev)

    // 右键菜单处理
    mainWindow.webContents.on('context-menu', (e) => {
        if (!isDev) {
            e.preventDefault()
        }
    })

    // 关闭事件处理
    mainWindow.on('close', (event) => {
        if (isDev) {
            // 开发模式直接关闭
            console.log('开发模式：直接关闭')
            return
        }
        // 生产模式显示确认对话框
        event.preventDefault()
        showExitDialog()
    })

    // 失去焦点处理
    mainWindow.on('blur', () => {
        if (!isDev) {
            mainWindow.focus()
        }
    })
}

function showExitDialog() {
    const result = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['取消', '确认退出'],
        defaultId: 0,
        title: '系统退出',
        message: '确定要退出消防检测系统吗？',
        detail: '退出后将返回系统桌面'
    })

    if (result === 1) {
        console.log('用户确认退出 - 开始清理资源')
        // 清理所有视频流和资源
        cleanup()
        // 设置强制退出标志
        global.forceQuit = true
        // 强制关闭所有窗口
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.destroy()
        }
        // 立即退出应用
        process.exit(0)
    }
}

// 清理函数
function cleanup() {
    console.log('开始清理资源...')
    
    // 停止所有视频流
    for (const [id, stream] of videoStreams) {
        if (stream.process && !stream.process.killed) {
            console.log(`停止视频流: ${id}`)
            stream.process.kill('SIGTERM')
        }
    }
    
    // 清理HLS文件
    try {
        if (fs.existsSync(HLS_DIR)) {
            const files = fs.readdirSync(HLS_DIR)
            files.forEach(file => {
                if (file.endsWith('.m3u8') || file.endsWith('.ts')) {
                    fs.unlinkSync(path.join(HLS_DIR, file))
                }
            })
        }
    } catch (error) {
        console.warn('清理HLS文件失败:', error)
    }
    
    // 关闭HLS服务器
    if (hlsServer) {
        hlsServer.close()
        console.log('HLS服务器已关闭')
    }
    
    videoStreams.clear()
    console.log('资源清理完成')
}

// IPC通信
ipcMain.handle('exit-app', () => {
    console.log('收到IPC退出请求 - 开始清理资源')
    // 清理所有视频流和资源
    cleanup()
    // 设置强制退出标志
    global.forceQuit = true
    // 强制关闭所有窗口
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy()
    }
    // 立即退出应用
    process.exit(0)
})

// IPC处理器 - 开始视频流
ipcMain.handle('start-video-stream', async (event, config) => {
    try {
        const { id, rtspUrl, containerId } = config
        console.log('开始视频流:', { id, rtspUrl, containerId })
        
        // 检查是否已存在
        if (videoStreams.has(id)) {
            return { success: false, error: '视频流已存在' }
        }
        
        // 获取FFmpeg路径
        const ffmpegPath = findFFmpegPath()
        if (!ffmpegPath) {
            return { success: false, error: 'FFmpeg未找到' }
        }
        
        // 创建HLS输出文件路径
        const hlsPlaylist = path.join(HLS_DIR, `${id}.m3u8`)
        const hlsSegment = path.join(HLS_DIR, `${id}_%03d.ts`)
        
        // FFmpeg参数
        const ffmpegArgs = [
            '-i', rtspUrl,                    // 输入RTSP流
            '-c:v', 'libx264',               // 视频编码器
            '-preset', 'ultrafast',          // 编码速度优先
            '-tune', 'zerolatency',          // 零延迟调优
            '-g', '30',                      // GOP大小
            '-sc_threshold', '0',            // 场景变化阈值
            '-c:a', 'aac',                   // 音频编码器
            '-b:a', '128k',                  // 音频码率
            '-ac', '2',                      // 音频声道数
            '-ar', '44100',                  // 音频采样率
            '-f', 'hls',                     // 输出格式HLS
            '-hls_time', '2',                // 每个片段2秒
            '-hls_list_size', '5',           // 保持5个片段
            '-hls_flags', 'delete_segments', // 删除旧片段
            '-hls_segment_filename', hlsSegment,
            hlsPlaylist
        ]
        
        console.log('FFmpeg命令:', ffmpegPath, ffmpegArgs.join(' '))
        
        // 启动FFmpeg进程
        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs)
        
        // 存储流信息
        videoStreams.set(id, {
            process: ffmpegProcess,
            rtspUrl,
            containerId,
            hlsPlaylist,
            startTime: new Date(),
            status: 'starting'
        })
        
        // 处理FFmpeg输出
        ffmpegProcess.stdout.on('data', (data) => {
            console.log(`FFmpeg stdout [${id}]:`, data.toString())
        })
        
        ffmpegProcess.stderr.on('data', (data) => {
            const output = data.toString()
            console.log(`FFmpeg stderr [${id}]:`, output)
            
            // 检查是否开始生成HLS文件
            if (output.includes('Opening') && output.includes('.m3u8')) {
                const stream = videoStreams.get(id)
                if (stream) {
                    stream.status = 'running'
                    videoStreams.set(id, stream)
                    console.log(`视频流 ${id} 开始运行`)
                }
            }
        })
        
        ffmpegProcess.on('close', (code) => {
            console.log(`FFmpeg进程 ${id} 退出，代码:`, code)
            const stream = videoStreams.get(id)
            if (stream) {
                stream.status = 'stopped'
                videoStreams.set(id, stream)
            }
        })
        
        ffmpegProcess.on('error', (error) => {
            console.error(`FFmpeg进程 ${id} 错误:`, error)
            const stream = videoStreams.get(id)
            if (stream) {
                stream.status = 'error'
                stream.error = error.message
                videoStreams.set(id, stream)
            }
        })
        
        // 等待一段时间确保流开始
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        return {
            success: true,
            streamId: id,
            hlsUrl: `http://localhost:${HLS_PORT}/hls/${id}.m3u8`
        }
        
    } catch (error) {
        console.error('启动视频流失败:', error)
        return { success: false, error: error.message }
    }
})

// IPC处理器 - 停止视频流
ipcMain.handle('stop-video-stream', async (event, streamId) => {
    try {
        console.log('停止视频流:', streamId)
        
        const stream = videoStreams.get(streamId)
        if (!stream) {
            return { success: false, error: '视频流不存在' }
        }
        
        // 终止FFmpeg进程
        if (stream.process && !stream.process.killed) {
            stream.process.kill('SIGTERM')
            
            // 等待进程结束
            await new Promise((resolve) => {
                stream.process.on('close', resolve)
                // 超时强制结束
                setTimeout(() => {
                    if (!stream.process.killed) {
                        stream.process.kill('SIGKILL')
                    }
                    resolve()
                }, 5000)
            })
        }
        
        // 清理HLS文件
        try {
            const hlsFiles = fs.readdirSync(HLS_DIR)
            hlsFiles.forEach(file => {
                if (file.startsWith(streamId)) {
                    fs.unlinkSync(path.join(HLS_DIR, file))
                }
            })
        } catch (error) {
            console.warn('清理HLS文件失败:', error)
        }
        
        // 移除流记录
        videoStreams.delete(streamId)
        
        console.log(`视频流 ${streamId} 停止成功`)
        return { success: true }
        
    } catch (error) {
        console.error('停止视频流失败:', error)
        return { success: false, error: error.message }
    }
})

// IPC处理器 - 获取视频流状态
ipcMain.handle('get-stream-status', async (event, streamId) => {
    const stream = videoStreams.get(streamId)
    if (!stream) {
        return { exists: false }
    }
    
    return {
        exists: true,
        status: stream.status,
        startTime: stream.startTime,
        rtspUrl: stream.rtspUrl,
        hlsUrl: `http://localhost:${HLS_PORT}/hls/${streamId}.m3u8`,
        error: stream.error
    }
})

// IPC处理器 - 获取所有视频流
ipcMain.handle('list-video-streams', async () => {
    const streams = []
    for (const [id, stream] of videoStreams) {
        streams.push({
            id,
            status: stream.status,
            startTime: stream.startTime,
            rtspUrl: stream.rtspUrl,
            hlsUrl: `http://localhost:${HLS_PORT}/hls/${id}.m3u8`,
            error: stream.error
        })
    }
    return streams
})

// 保存截图IPC处理
ipcMain.handle('save-screenshot', async (event, dataURL, defaultName) => {
    try {
        console.log('收到保存截图请求，开始处理...')
        console.log('默认文件名:', defaultName)

        // 使用同步对话框避免生产模式下的异步问题
        const result = dialog.showSaveDialogSync(mainWindow, {
            title: '保存监控截图',
            defaultPath: defaultName || '监控截图.png',
            filters: [
                { name: 'PNG图片', extensions: ['png'] },
                { name: '所有文件', extensions: ['*'] }
            ]
        })

        console.log('对话框结果:', result)

        if (!result) {
            console.log('用户取消保存操作')
            return { success: false, message: '用户取消保存' }
        }

        console.log('准备保存到路径:', result)

        // 将base64数据转换为Buffer
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')

        console.log('数据转换完成，开始写入文件...')

        // 保存文件
        fs.writeFileSync(result, buffer)

        console.log('截图保存成功:', result)
        return { success: true, filePath: result }

    } catch (error) {
        console.error('保存截图失败:', error)
        console.error('错误详情:', error.stack)
        return { success: false, message: error.message }
    }
})



app.whenReady().then(async () => {
    try {
        // 初始化HLS目录和服务器
        initHLSDirectory()
        startHLSServer()
        
        // 创建主窗口
        createWindow()
        
        console.log('应用初始化完成')
    } catch (error) {
        console.error('应用初始化失败:', error)
        app.quit()
    }

    if (isDev) {
        console.log('注册开发模式快捷键')
        // 开发模式快捷键
        globalShortcut.register('Ctrl+R', () => {
            console.log('刷新页面')
            mainWindow.reload()
        })
        globalShortcut.register('F5', () => {
            console.log('F5刷新页面')
            mainWindow.reload()
        })
        globalShortcut.register('Ctrl+Shift+I', () => {
            console.log('切换开发者工具')
            mainWindow.webContents.toggleDevTools()
        })
        globalShortcut.register('F12', () => {
            console.log('F12开发者工具')
            mainWindow.webContents.toggleDevTools()
        })
        // 开发模式强制退出
        globalShortcut.register('Ctrl+Q', () => {
            console.log('Ctrl+Q 强制退出 - 开始清理资源')
            // 清理所有视频流和资源
            cleanup()
            // 设置强制退出标志
            global.forceQuit = true
            // 强制关闭所有窗口
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.destroy()
            }
            // 立即退出应用
            process.exit(0)
        })
    } else {
        console.log('注册生产模式快捷键')
        // 生产模式快捷键
        globalShortcut.register('Ctrl+Alt+Shift+Q', () => {
            showExitDialog()
        })

        // 禁用其他快捷键（保留Alt+F4和F12）
        globalShortcut.register('F11', () => { })
        globalShortcut.register('Escape', () => { })
        globalShortcut.register('Ctrl+Shift+I', () => { })
    }
})

app.on('window-all-closed', () => {
    if (isDev) {
        console.log('开发模式：允许退出')
        app.quit()
    } else if (global.forceQuit) {
        console.log('生产模式：强制退出')
        app.quit()
    } else {
        console.log('生产模式：阻止自动退出，等待用户确认')
        // 不自动退出，等待用户通过退出按钮确认
    }
})

app.on('before-quit', (event) => {
    if (!isDev && !global.forceQuit) {
        console.log('生产模式：阻止退出，显示确认对话框')
        event.preventDefault()
        showExitDialog()
    } else {
        console.log('允许退出：开发模式或强制退出')
        // 当forceQuit为true时，不阻止退出
    }
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

// 设置开机自启动（仅生产模式）
if (!isDev) {
    const appPath = app.isPackaged ? process.execPath : path.join(__dirname, '../node_modules/electron/dist/electron.exe')
    console.log('设置开机自启动路径:', appPath)
    app.setLoginItemSettings({
        openAtLogin: true,
        path: appPath,
        args: app.isPackaged ? [] : [path.join(__dirname, '../')]
    })
}