const fs = require('fs')
const path = require('path')

/**
 * 构建后优化脚本 - 针对4核2G硬件
 */
exports.default = async function afterPack(context) {
  console.log('🔧 开始构建后优化...')
  
  const { appOutDir, electronPlatformName } = context
  console.log(`应用输出目录: ${appOutDir}`)
  console.log(`平台: ${electronPlatformName}`)
  
  // 清理不必要的文件以减少应用体积
  const unnecessaryFiles = [
    'LICENSES.chromium.html',
    'version',
    '*.pak.info',
    'chrome_crashpad_handler*',
    'chrome_100_percent.pak',
    'chrome_200_percent.pak'
  ]
  
  unnecessaryFiles.forEach(pattern => {
    const files = findFiles(appOutDir, pattern)
    files.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`删除不必要文件: ${path.basename(file)}`)
        fs.unlinkSync(file)
      }
    })
  })
  
  // 优化资源文件
  const resourcesPath = path.join(appOutDir, 'resources')
  if (fs.existsSync(resourcesPath)) {
    // 压缩app.asar以减少体积
    const asarPath = path.join(resourcesPath, 'app.asar')
    if (fs.existsSync(asarPath)) {
      const stats = fs.statSync(asarPath)
      console.log(`app.asar 大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    }
  }
  
  // 创建性能优化配置文件
  const configPath = path.join(appOutDir, 'performance.json')
  const performanceConfig = {
    optimizedFor: '4核2G硬件',
    memoryLimit: '1024MB',
    cpuCores: 4,
    recommendations: {
      maxConcurrentTasks: 2,
      memoryThreshold: 0.8,
      cpuThreshold: 0.6
    },
    buildTime: new Date().toISOString(),
    version: require('../package.json').version
  }
  
  fs.writeFileSync(configPath, JSON.stringify(performanceConfig, null, 2))
  console.log('创建性能配置文件: performance.json')
  
  // 生成部署检查清单
  const checklistPath = path.join(appOutDir, 'deployment-checklist.txt')
  const checklist = `消防设备终端 - 4核2G硬件部署检查清单

部署前检查:
□ 系统内存至少2GB
□ 可用存储空间至少500MB
□ 关闭不必要的后台应用
□ 确保网络连接稳定

部署后验证:
□ 应用正常启动（30秒内）
□ 内存使用低于1.2GB
□ CPU使用率低于50%
□ 界面响应流畅
□ 退出功能正常

性能监控:
□ 定期检查内存使用
□ 监控CPU占用率
□ 观察启动时间
□ 记录异常情况

维护建议:
□ 每周重启应用
□ 每月清理临时文件
□ 定期检查系统更新

生成时间: ${new Date().toLocaleString()}
版本: ${require('../package.json').version}`
  
  fs.writeFileSync(checklistPath, checklist)
  console.log('创建部署检查清单: deployment-checklist.txt')
  
  // FFmpeg相关配置已移除
  
  console.log('✅ 构建后优化完成')
}

// 辅助函数：查找文件
function findFiles(dir, pattern) {
  const files = []
  if (!fs.existsSync(dir)) return files
  
  const items = fs.readdirSync(dir)
  items.forEach(item => {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, pattern))
    } else if (item.includes(pattern.replace('*', ''))) {
      files.push(fullPath)
    }
  })
  
  return files
}