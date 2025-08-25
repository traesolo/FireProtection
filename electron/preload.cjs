const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 应用控制
  exitApp: () => ipcRenderer.invoke('exit-app'),
  saveScreenshot: (dataURL, defaultName) => ipcRenderer.invoke('save-screenshot', dataURL, defaultName)
})