/**
 * 日志管理器
 * 用于收集、存储和管理应用程序的日志信息
 */

class LogManager {
  constructor() {
    this.logs = []
    this.maxLogs = 1000 // 最大日志数量
    this.storageKey = 'app_logs'
    
    this.loadLogs()
    // console拦截功能已移除
  }

  /**
   * 添加日志
   * @param {string} level - 日志级别 (log, error, warn, info)
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  addLog(level, message, data = null) {
    const logEntry = {
      timestamp: Date.now(),
      level,
      message: String(message),
      data: data ? this.serializeData(data) : null
    }

    this.logs.push(logEntry)
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    this.saveLogs()
  }

  /**
   * 序列化数据
   * @param {any} data - 要序列化的数据
   * @returns {any} 序列化后的数据
   */
  serializeData(data) {
    try {
      // 处理循环引用和不可序列化的对象
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'function') {
          return '[Function]'
        }
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack
          }
        }
        if (value instanceof HTMLElement) {
          return `[HTMLElement: ${value.tagName}]`
        }
        return value
      }))
    } catch (error) {
      return String(data)
    }
  }

  /**
   * console拦截功能已移除
   */

  /**
   * 恢复console方法功能已移除
   */
  restoreConsole() {
    // 无需恢复，因为没有重写console方法
  }

  /**
   * 保存日志到localStorage
   */
  saveLogs() {
    try {
      // ARM64环境下的特殊处理
      if (this.isARM64Environment()) {
        // 在ARM64环境下使用更小的批次保存
        const jsonString = JSON.stringify(this.logs)
        if (jsonString.length > 1024 * 1024) { // 1MB限制
          this.logs = this.logs.slice(-300) // 保留更少的日志
        }
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
    } catch (error) {
      console.warn('localStorage保存失败，尝试清理旧日志:', error)
      // localStorage可能已满，删除旧日志
      this.logs = this.logs.slice(-500)
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
      } catch (e) {
        console.error('无法保存日志到localStorage:', e)
        // ARM64环境下的备用方案
        if (this.isARM64Environment()) {
          this.handleARM64StorageFailure()
        }
      }
    }
  }

  /**
   * 检测是否为ARM64环境
   */
  isARM64Environment() {
    const userAgent = navigator.userAgent || ''
    const platform = navigator.platform || ''
    return userAgent.includes('aarch64') || 
           userAgent.includes('arm64') || 
           platform.includes('arm') ||
           (typeof process !== 'undefined' && process.arch === 'arm64')
  }
  
  /**
   * ARM64环境下的存储失败处理
   */
  handleARM64StorageFailure() {
    console.warn('ARM64环境下localStorage失败，使用内存存储')
    // 在ARM64环境下，如果localStorage失败，只保留最近的日志在内存中
    this.logs = this.logs.slice(-100)
    // 尝试使用sessionStorage作为备用
    try {
      sessionStorage.setItem(this.storageKey + '_backup', JSON.stringify(this.logs))
      console.log('已使用sessionStorage作为备用存储')
    } catch (e) {
      console.warn('sessionStorage也不可用，仅使用内存存储')
    }
  }
  
  /**
   * 从localStorage加载日志
   */
  loadLogs() {
    try {
      const savedLogs = localStorage.getItem(this.storageKey)
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs)
      } else if (this.isARM64Environment()) {
        // ARM64环境下尝试从sessionStorage加载备用数据
        try {
          const backupLogs = sessionStorage.getItem(this.storageKey + '_backup')
          if (backupLogs) {
            this.logs = JSON.parse(backupLogs)
            console.log('从sessionStorage恢复了备用日志')
          }
        } catch (e) {
          console.warn('无法从sessionStorage加载备用日志:', e)
        }
      }
    } catch (error) {
      console.error('加载日志失败:', error)
      this.logs = []
      // ARM64环境下的额外处理
      if (this.isARM64Environment()) {
        console.log('ARM64环境检测到，将使用优化的日志处理策略')
      }
    }
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    localStorage.removeItem(this.storageKey)
  }

  /**
   * 获取所有日志
   * @returns {Array} 日志数组
   */
  getLogs() {
    return [...this.logs]
  }

  /**
   * 获取指定级别的日志
   * @param {string} level - 日志级别
   * @returns {Array} 过滤后的日志数组
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * 搜索日志
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的日志数组
   */
  searchLogs(keyword) {
    const lowerKeyword = keyword.toLowerCase()
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerKeyword) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerKeyword))
    )
  }

  /**
   * 导出日志
   * @param {string} format - 导出格式 ('json' | 'text')
   * @returns {string} 导出的日志内容
   */
  exportLogs(format = 'text') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2)
    }
    
    return this.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleString('zh-CN')
      let line = `[${time}] [${log.level.toUpperCase()}] ${log.message}`
      if (log.data) {
        line += `\n${JSON.stringify(log.data, null, 2)}`
      }
      return line
    }).join('\n\n')
  }
}

// 创建全局日志管理器实例
const logManager = new LogManager()

// 全局错误处理已移除

export default logManager