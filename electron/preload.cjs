const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // 应用控制
    exitApp: () => ipcRenderer.invoke('exit-app'),
    saveScreenshot: (dataURL, defaultName) => ipcRenderer.invoke('save-screenshot', dataURL, defaultName)
    
    // 视频流控制API已移除，现在直接从接口获取视频流
})