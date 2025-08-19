const fs = require('fs')
const path = require('path')

/**
 * 构建前优化脚本 - 针对4核2G硬件
 */
exports.default = async function beforeBuild(context) {
  console.log('🚀 开始构建前优化...')
  
  // 检查构建环境
  const { platform, arch } = context
  console.log(`构建平台: ${platform}-${arch}`)
  
  // 清理临时文件
  const tempDirs = ['node_modules/.cache', 'dist', '.vite']
  tempDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (fs.existsSync(fullPath)) {
      console.log(`清理临时目录: ${dir}`)
      fs.rmSync(fullPath, { recursive: true, force: true })
    }
  })
  
  // 优化package.json
  const packagePath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  // 移除开发依赖以减少打包体积
  if (packageJson.devDependencies) {
    console.log('移除开发依赖以减少打包体积')
    delete packageJson.devDependencies
  }
  
  // 优化scripts
  if (packageJson.scripts) {
    const optimizedScripts = {
      start: packageJson.scripts.start || 'electron electron/main.cjs'
    }
    packageJson.scripts = optimizedScripts
  }
  
  // 写入优化后的package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
  
  console.log('✅ 构建前优化完成')
}