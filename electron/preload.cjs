const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // 应用控制
    exitApp: () => ipcRenderer.invoke('exit-app'),
    saveScreenshot: (dataURL, defaultName) => ipcRenderer.invoke('save-screenshot', dataURL, defaultName),
    
    // 视频流控制
    videoStream: {
        // 启动视频流
        start: (config) => ipcRenderer.invoke('start-video-stream', config),
        // 停止视频流
        stop: (streamId) => ipcRenderer.invoke('stop-video-stream', streamId),
        // 获取流状态
        getStatus: (streamId) => ipcRenderer.invoke('get-stream-status', streamId),
        // 获取所有流列表
        list: () => ipcRenderer.invoke('list-video-streams')
    }
})