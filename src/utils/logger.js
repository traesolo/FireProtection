// 日志工具 - 简化版本，不进行日志重定向

class Logger {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI
  }

  // 日志重定向功能已移除

  // 发送日志功能已移除

  // 获取日志路径功能已移除
  async getLogPath() {
    return null
  }

  // 读取日志文件功能已移除
  async readLogFile(lines = 100) {
    return { success: false, error: '日志文件读取功能已移除' }
  }

  // 恢复console方法功能已移除
  restoreConsole() {
    // 无需恢复，因为没有重写console方法
  }
}

// 创建全局日志实例
const logger = new Logger()

export default logger