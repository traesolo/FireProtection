const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const express = require('express')

let mainWindow
let hlsServer = null
const HLS_PORT = 8080
const HLS_DIR = path.join(__dirname, '../hls')

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
            res.json({ status: 'ok', message: 'HLS server running in dev mode' })
        })
        
        hlsServer = http.createServer(app)
        hlsServer.listen(HLS_PORT, () => {
            console.log(`开发模式HLS服务器启动成功，端口: ${HLS_PORT}`)
        })
        
        hlsServer.on('error', (error) => {
            console.error('HLS服务器错误:', error)
        })
        
    } catch (error) {
        console.error('启动HLS服务器失败:', error)
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.cjs')
        }
    })

    // 直接加载开发服务器
    mainWindow.loadURL('http://localhost:3001')

    // 自动打开开发者工具
    mainWindow.webContents.openDevTools()

    // 添加错误处理
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('加载失败:', errorCode, errorDescription, validatedURL)
    })
}

app.whenReady().then(() => {
    try {
        // 初始化HLS目录和服务器
        initHLSDirectory()
        startHLSServer()
        
        // 创建主窗口
        createWindow()
        
        console.log('开发模式应用初始化完成')
    } catch (error) {
        console.error('开发模式应用初始化失败:', error)
        app.quit()
    }
})

app.on('window-all-closed', () => {
    // 关闭HLS服务器
    if (hlsServer) {
        hlsServer.close(() => {
            console.log('HLS服务器已关闭')
        })
    }
    app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})