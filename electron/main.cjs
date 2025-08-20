const { app, BrowserWindow, globalShortcut, dialog, ipcMain, Menu } = require('electron')
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
app.commandLine.appendSwitch('--no-sandbox') // 禁用沙盒模式，解决ARM64 Linux环境运行问题

// 视频流相关代码已移除，直接从接口获取视频流

// FFmpeg相关代码已移除

// HLS相关代码已移除

// HLS服务器相关代码已移除

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
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: false, // 禁用web安全检查以支持开发者工具
            allowRunningInsecureContent: false, // 禁止运行不安全内容
            // 4核2G硬件优化配置
            backgroundThrottling: false, // 禁用后台节流
            nodeIntegrationInWorker: false, // 禁用Worker中的Node集成
            nodeIntegrationInSubFrames: false, // 禁用子框架中的Node集成
            spellcheck: false, // 禁用拼写检查
            // Linux ARM64 输入兼容性配置
            enableRemoteModule: false, // 确保远程模块被禁用
            experimentalFeatures: false, // 禁用实验性功能
            navigateOnDragDrop: false, // 禁用拖拽导航
            disableBlinkFeatures: 'Auxclick', // 禁用可能干扰输入的Blink特性
            enableBlinkFeatures: 'CSSColorSchemeUARendering' // 启用必要的渲染特性
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
        
        // Linux ARM64 输入兼容性：注入键盘事件处理代码
        if (process.platform === 'linux') {
            mainWindow.webContents.executeJavaScript(`
                // 防止Alt键激活菜单导致输入框失焦
                document.addEventListener('keydown', function(event) {
                    if (event.altKey && (event.key === 'Shift' || event.key === 'Control')) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }, true);
                
                // 确保Element Plus输入框能正确接收键盘事件
                document.addEventListener('DOMContentLoaded', function() {
                    // 监听所有Element Plus组件
                    const observer = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.nodeType === 1) {
                                    // 修复输入框
                                    const inputs = node.querySelectorAll ? node.querySelectorAll('.el-input__inner') : [];
                                    inputs.forEach(function(input) {
                                        input.setAttribute('tabindex', '0');
                                        input.style.pointerEvents = 'auto';
                                        input.style.userSelect = 'text';
                                    });
                                    
                                    // 修复选择器
                                    const selects = node.querySelectorAll ? node.querySelectorAll('.el-select') : [];
                                    selects.forEach(function(select) {
                                        select.style.pointerEvents = 'auto';
                                        const wrapper = select.querySelector('.el-select__wrapper');
                                        if (wrapper) {
                                            wrapper.style.pointerEvents = 'auto';
                                            wrapper.style.cursor = 'pointer';
                                        }
                                    });
                                    
                                    // 修复按钮
                                    const buttons = node.querySelectorAll ? node.querySelectorAll('button, .el-button') : [];
                                    buttons.forEach(function(button) {
                                        button.style.pointerEvents = 'auto';
                                        button.style.cursor = 'pointer';
                                    });
                                    
                                    // 修复表格
                                    const tables = node.querySelectorAll ? node.querySelectorAll('.el-table') : [];
                                    tables.forEach(function(table) {
                                        table.style.pointerEvents = 'auto';
                                    });
                                    
                                    // 修复上传组件
                                    const uploads = node.querySelectorAll ? node.querySelectorAll('.el-upload') : [];
                                    uploads.forEach(function(upload) {
                                        upload.style.pointerEvents = 'auto';
                                    });
                                }
                            });
                        });
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                    
                    // 立即处理已存在的组件
                    setTimeout(function() {
                        // 处理输入框
                        const existingInputs = document.querySelectorAll('.el-input__inner');
                        existingInputs.forEach(function(input) {
                            input.setAttribute('tabindex', '0');
                            input.style.pointerEvents = 'auto';
                            input.style.userSelect = 'text';
                        });
                        
                        // 处理选择器
                        const existingSelects = document.querySelectorAll('.el-select');
                        existingSelects.forEach(function(select) {
                            select.style.pointerEvents = 'auto';
                            const wrapper = select.querySelector('.el-select__wrapper');
                            if (wrapper) {
                                wrapper.style.pointerEvents = 'auto';
                                wrapper.style.cursor = 'pointer';
                            }
                        });
                        
                        // 处理按钮
                        const existingButtons = document.querySelectorAll('button, .el-button');
                        existingButtons.forEach(function(button) {
                            button.style.pointerEvents = 'auto';
                            button.style.cursor = 'pointer';
                        });
                        
                        // 处理其他交互元素
                        const interactiveElements = document.querySelectorAll('[role="button"], [tabindex]');
                        interactiveElements.forEach(function(element) {
                            element.style.pointerEvents = 'auto';
                        });
                    }, 1000);
                });
            `);
        }
    })

    // 开发模式显示菜单栏
    mainWindow.setMenuBarVisibility(isDev)

    // 右键菜单处理 - 添加检查元素功能
    mainWindow.webContents.on('context-menu', (e, params) => {
        console.log('右键菜单触发')
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '检查元素',
                click: () => {
                    mainWindow.webContents.inspectElement(params.x, params.y)
                }
            },
            {
                label: '开发者工具',
                click: () => {
                    mainWindow.webContents.toggleDevTools()
                }
            },
            { type: 'separator' },
            {
                label: '刷新',
                accelerator: 'F5',
                click: () => {
                    mainWindow.webContents.reload()
                }
            }
        ])
        contextMenu.popup({ window: mainWindow })
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

// 视频流IPC处理器已移除

// 停止视频流IPC处理器已移除

// 视频流状态和列表IPC处理器已移除

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

        // 生产模式下启用F12开发者工具（用于调试）
        globalShortcut.register('F12', () => {
            console.log('F12开发者工具（生产模式）')
            mainWindow.webContents.toggleDevTools()
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