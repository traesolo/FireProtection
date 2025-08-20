const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow
// HLS服务器相关变量已移除

// HLS目录初始化和服务器启动函数已移除

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
        // 创建主窗口
        createWindow()
        
        console.log('开发模式应用初始化完成')
    } catch (error) {
        console.error('开发模式应用初始化失败:', error)
        app.quit()
    }
})

app.on('window-all-closed', () => {
    app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})