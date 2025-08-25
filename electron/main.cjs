const { app, BrowserWindow, globalShortcut, dialog, ipcMain, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const http = require('http')
const express = require('express')

// 强制生产模式检测，避免误判
// 只有在明确的开发环境下才为true，避免开机自启动时误判
const isDev = (process.env.NODE_ENV === 'development' ||
  process.env.IS_DEV === 'true') &&
  !app.isPackaged

// 日志配置
const logDir = path.join(app.getPath('userData'), 'logs')
const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 控制台日志重定向功能 - 确保Linux ARM64环境下能看到日志
if (!isDev) {
  // 生产环境下重定向控制台输出到文件和标准输出
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  }

  const writeLog = (level, ...args) => {
    const timestamp = new Date().toISOString()
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    // 强制刷新标准输出和错误输出（Linux ARM64兼容）
    if (level === 'error') {
      process.stderr.write(logEntry + '\n')
      if (process.stderr.isTTY) {
        process.stderr.write('\x1b[0m') // 重置颜色
      }
    } else {
      process.stdout.write(logEntry + '\n')
      if (process.stdout.isTTY) {
        process.stdout.write('\x1b[0m') // 重置颜色
      }
    }

    // 强制刷新缓冲区
    try {
      if (process.stdout.flush) process.stdout.flush()
      if (process.stderr.flush) process.stderr.flush()
    } catch (e) {
      // 忽略刷新错误
    }

    // 同时写入到文件
    try {
      fs.appendFileSync(logFile, logEntry + '\n')
    } catch (err) {
      // 如果文件写入失败，至少保证控制台输出
      process.stderr.write(`日志文件写入失败: ${err.message}\n`)
    }

    // 调用原始console方法
    originalConsole[level](...args)
  }

  console.log = (...args) => writeLog('log', ...args)
  console.error = (...args) => writeLog('error', ...args)
  console.warn = (...args) => writeLog('warn', ...args)
  console.info = (...args) => writeLog('info', ...args)

  // 启动时输出重要信息
  console.log('=== 消防设备终端启动 ===')
  console.log('控制台日志重定向已启用 - Linux ARM64兼容模式')
  console.log(`日志文件: ${logFile}`)
  console.log(`系统架构: ${process.arch}`)
  console.log(`平台: ${process.platform}`)
  console.log(`Node.js版本: ${process.version}`)
  console.log(`Electron版本: ${process.versions.electron}`)
  console.log('=========================')
}

// 针对4核2G硬件的性能优化
app.commandLine.appendSwitch('--max-old-space-size', '1024') // 限制V8内存使用为1GB
app.commandLine.appendSwitch('--memory-pressure-off') // 关闭内存压力检测
app.commandLine.appendSwitch('--max-http-cache-size', '0') // 禁用HTTP缓存
app.commandLine.appendSwitch('--disable-background-timer-throttling') // 禁用后台定时器节流
app.commandLine.appendSwitch('--disable-renderer-backgrounding') // 禁用渲染器后台化
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows') // 禁用被遮挡窗口的后台化
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor') // 禁用某些GPU特性以减少内存使用
app.commandLine.appendSwitch('--no-sandbox') // 禁用沙盒模式，解决ARM64 Linux环境运行问题

// GPU加速相关配置 - 针对无GPU的一体机设备和驱动问题
// 使用最简单有效的软件渲染配置
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('--disable-gpu')
app.commandLine.appendSwitch('--disable-gpu-sandbox')
app.commandLine.appendSwitch('--disable-software-rasterizer')
app.commandLine.appendSwitch('--disable-dev-shm-usage')
app.commandLine.appendSwitch('--disable-web-security')
// 强制使用CPU渲染，避免GPU进程崩溃
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor,VizServiceDisplay')
app.commandLine.appendSwitch('--use-gl', 'disabled')
app.commandLine.appendSwitch('--disable-angle') // 禁用ANGLE
console.log('GPU加速已完全禁用，使用软件渲染，解决libGL和rockchip驱动问题')

// VLC相关代码已移除

// VLC路径获取功能已移除

// VLC流启动功能已移除

// VLC流停止功能已移除

// VLC流状态获取功能已移除

// VLC进程管理功能已移除

// 视频流相关代码已移除，直接从接口获取视频流

// FFmpeg相关代码已移除

// HLS相关代码已移除

// HLS服务器相关代码已移除

// 更可靠的开发环境检测
console.log('=== 环境检测详情 ===')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('isPackaged:', app.isPackaged)
console.log('process.argv:', process.argv)
console.log('__dirname:', __dirname)
console.log('计算后的isDev:', isDev)
console.log('=====================')

// console重写功能已移除

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
      webSecurity: false, // 禁用web安全检查以支持本地资源加载
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
      disableBlinkFeatures: 'Auxclick' // 禁用可能干扰输入的Blink特性
    },
    show: false
  }

  console.log('窗口配置:', windowConfig)
  mainWindow = new BrowserWindow(windowConfig)

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  console.log('加载URL:', startUrl)
  console.log('__dirname:', __dirname)
  console.log('app.getAppPath():', app.getAppPath())
  console.log('文件是否存在:', fs.existsSync(path.resolve(__dirname, '../dist/index.html')))
  
  // 在asar环境中，检查文件存在性
  const distPath = path.resolve(__dirname, '../dist/index.html')
  console.log('完整路径:', distPath)
  console.log('是否为asar路径:', distPath.includes('.asar'))
  
  // 如果是asar环境，直接使用相对路径
  if (distPath.includes('.asar')) {
    console.log('检测到asar环境，使用asar内部路径')
  }
  
  console.log('准备加载页面:', startUrl)
  
  mainWindow.loadURL(startUrl).then(() => {
    console.log('页面加载成功')
  }).catch(err => {
    console.error('页面加载失败:', err)
    console.error('错误详情:', err.stack)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
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
    // 如果是通过IPC退出（用户已验证身份）、快捷键退出或对话框退出，直接关闭
    if (global.ipcExit || global.shortcutExit || global.dialogExit || global.forceQuit) {
      console.log('IPC退出、快捷键退出、对话框退出或强制退出：直接关闭')
      return
    }
    // 生产模式显示确认对话框
    event.preventDefault()
    showExitDialog().catch(error => {
      console.error('显示退出对话框失败:', error)
      // 如果对话框失败，强制退出
      global.forceQuit = true
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy()
      }
      app.quit()
    })
  })

  // 失去焦点处理
  mainWindow.on('blur', () => {
    if (!isDev) {
      mainWindow.focus()
    }
  })
}

async function showExitDialog() {
  try {
    // 确保主窗口存在且未被销毁
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.log('主窗口不存在，直接退出')
      app.quit()
      return
    }

    // 使用异步对话框，避免UI冻结
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['取消', '确认退出'],
      defaultId: 0,
      cancelId: 0,
      title: '系统退出',
      message: '确定要退出消防检测系统吗？',
      detail: '退出后将返回系统桌面',
      noLink: true
    })

    if (result.response === 1) {
      console.log('用户确认退出 - 开始清理资源')

      try {
        // 清理所有视频流和资源
        cleanup()

        // 设置强制退出标志
        global.forceQuit = true
        global.dialogExit = true // 标记这是通过对话框退出的

        // 温和地关闭窗口
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.closeDevTools()
          mainWindow.close()
        }

        // 给一些时间让窗口正常关闭
        setTimeout(() => {
          // 如果窗口还没关闭，强制销毁
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.destroy()
          }
          // 退出应用
          app.quit()
        }, 1000)

      } catch (error) {
        console.error('退出过程中发生错误:', error)
        // 如果出现错误，强制退出
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy()
        }
        process.exit(1)
      }
    } else {
      console.log('用户取消退出')
    }
  } catch (error) {
    console.error('显示退出对话框时发生错误:', error)
    // 如果对话框出错，提供备用退出方式
    console.log('对话框出错，执行强制退出')
    global.forceQuit = true
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy()
    }
    app.quit()
  }
}

// 清理函数
function cleanup() {
  console.log('开始清理资源...')

  // 停止所有原生播放器


  // 停止所有VLC进程
  try {
    console.log('停止所有VLC进程...')
    stopAllVlcStreams().then(() => {
      console.log('所有VLC进程已停止')
    }).catch(error => {
      console.error('停止VLC进程时出错:', error)
    })
  } catch (error) {
    console.error('清理VLC进程失败:', error)
  }

  try {
    // 清理可能的临时文件
    const tempDir = path.join(__dirname, 'temp')
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir)
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(tempDir, file))
        } catch (err) {
          console.warn(`清理临时文件失败: ${file}`, err)
        }
      })
    }
  } catch (error) {
    console.warn('清理临时文件失败:', error)
  }

  console.log('资源清理完成')
}

// 日志相关IPC处理已移除

// IPC通信
ipcMain.handle('exit-app', async () => {
  console.log('收到IPC退出请求 - 用户已通过身份验证，开始清理资源')

  try {
    // 清理所有视频流和资源
    cleanup()

    // 设置强制退出标志，避免重复显示确认对话框
    global.forceQuit = true
    global.ipcExit = true // 标记这是通过IPC退出的

    // 温和地关闭窗口
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.closeDevTools()
      mainWindow.close()
    }

    // 给一些时间让窗口正常关闭
    setTimeout(() => {
      // 如果窗口还没关闭，强制销毁
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy()
      }
      // 退出应用
      app.quit()
    }, 1000)

  } catch (error) {
    console.error('退出过程中发生错误:', error)
    // 如果出现错误，强制退出
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy()
    }
    process.exit(1)
  }
})

// VLC IPC处理器已移除

// 原生播放器IPC处理器


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

      try {
        // 清理所有视频流和资源
        cleanup()

        // 设置强制退出标志
        global.forceQuit = true

        // 温和地关闭窗口
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.closeDevTools()
          mainWindow.close()
        }

        // 给一些时间让窗口正常关闭
        setTimeout(() => {
          // 如果窗口还没关闭，强制销毁
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.destroy()
          }
          // 退出应用
          app.quit()
        }, 500) // 开发模式下缩短等待时间

      } catch (error) {
        console.error('退出过程中发生错误:', error)
        // 如果出现错误，强制退出
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy()
        }
        process.exit(1)
      }
    })
  } else {
    console.log('注册生产模式快捷键')
    // 生产模式快捷键 - 直接退出，避免对话框问题
    globalShortcut.register('Ctrl+Alt+Shift+Q', () => {
      console.log('快捷键退出 - 开始清理资源')
      try {
        // 清理所有视频流和资源
        cleanup()
        
        // 设置强制退出标志
        global.forceQuit = true
        global.shortcutExit = true // 标记这是通过快捷键退出的
        
        // 温和地关闭窗口
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.closeDevTools()
          mainWindow.close()
        }
        
        // 给一些时间让窗口正常关闭
        setTimeout(() => {
          // 如果窗口还没关闭，强制销毁
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.destroy()
          }
          // 退出应用
          app.quit()
        }, 1000)
        
      } catch (error) {
        console.error('快捷键退出过程中发生错误:', error)
        // 如果出现错误，强制退出
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy()
        }
        process.exit(1)
      }
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
  console.log('应用即将退出')
  if (!isDev && !global.forceQuit && !global.ipcExit && !global.shortcutExit && !global.dialogExit) {
    console.log('生产模式：阻止退出，显示确认对话框')
    event.preventDefault()
    showExitDialog().catch(error => {
      console.error('显示退出对话框失败:', error)
      // 如果对话框失败，允许退出
      global.forceQuit = true
    })
  } else {
    console.log('允许退出：开发模式、强制退出、IPC退出、快捷键退出或对话框退出')
    // 当forceQuit、ipcExit、shortcutExit或dialogExit为true时，不阻止退出
  }
})

app.on('will-quit', (event) => {
  console.log('应用将要退出')
  globalShortcut.unregisterAll()
})

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  console.error('错误详情:', error.stack)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
  console.error('Promise:', promise)
})