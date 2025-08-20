#!/usr/bin/env node
/**
 * FFmpeg 路径测试脚本
 * 用于验证不同平台和架构下的 FFmpeg 路径配置
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 模拟不同的平台和架构组合
const testCases = [
  { platform: 'linux', arch: 'arm64' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'win32', arch: 'x64' },
  { platform: 'win32', arch: 'arm64' },
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'darwin', arch: 'x64' }
]

// 复制主进程中的 FFmpeg 路径检测逻辑
function findFFmpegPath(platform, arch, isPackaged = false) {
  console.log(`\n🔍 测试平台: ${platform}, 架构: ${arch}, 打包: ${isPackaged}`)

  let ffmpegDir

  if (isPackaged) {
    // 模拟打包环境路径
    ffmpegDir = path.join(__dirname, '../dist/resources/app.asar.unpacked/ffmpeg')
  } else {
    // 开发环境路径
    ffmpegDir = path.join(__dirname, '../ffmpeg')
  }

  console.log(`📁 FFmpeg目录: ${ffmpegDir}`)

  // 检查 ffmpeg 目录是否存在
  if (!fs.existsSync(ffmpegDir)) {
    console.log(`❌ FFmpeg目录不存在: ${ffmpegDir}`)
    return null
  }

  let ffmpegPath
  let fallbackPaths = []

  if (platform === 'win32') {
    // Windows平台
    if (arch === 'arm64' || arch === 'aarch64') {
      ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.1.1-win-arm64', 'bin', 'ffmpeg.exe')
      fallbackPaths.push(path.join(ffmpegDir, 'ffmpeg-7.1.1-essentials_build', 'bin', 'ffmpeg.exe'))
    } else {
      ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.1.1-essentials_build', 'bin', 'ffmpeg.exe')
    }
  } else if (platform === 'linux') {
    // Linux平台
    if (arch === 'arm64' || arch === 'aarch64') {
      ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.0.2-arm64-static', 'ffmpeg')
      fallbackPaths.push(path.join(ffmpegDir, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg'))
    } else {
      ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg')
    }
  } else if (platform === 'darwin') {
    // macOS平台
    if (arch === 'arm64' || arch === 'aarch64') {
      ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.0.2-macos-arm64', 'ffmpeg')
      fallbackPaths.push(path.join(ffmpegDir, 'ffmpeg-7.0.2-macos-x64', 'ffmpeg'))
    } else {
      ffmpegPath = path.join(ffmpegDir, 'ffmpeg-7.0.2-macos-x64', 'ffmpeg')
    }
  } else {
    console.log(`❌ 不支持的平台: ${platform}`)
    return null
  }

  console.log(`🎯 首选路径: ${ffmpegPath}`)

  // 检查首选路径
  if (fs.existsSync(ffmpegPath)) {
    console.log(`✅ 找到FFmpeg: ${ffmpegPath}`)
    return ffmpegPath
  }

  // 尝试fallback路径
  for (const fallbackPath of fallbackPaths) {
    console.log(`🔄 尝试fallback: ${fallbackPath}`)
    if (fs.existsSync(fallbackPath)) {
      console.log(`✅ 使用fallback FFmpeg: ${fallbackPath}`)
      return fallbackPath
    }
  }

  // 尝试系统PATH中的ffmpeg
  console.log(`🔄 尝试系统FFmpeg`)
  try {
    const systemFFmpeg = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    execSync(`${systemFFmpeg} -version`, { stdio: 'ignore' })
    console.log(`✅ 使用系统FFmpeg: ${systemFFmpeg}`)
    return systemFFmpeg
  } catch (error) {
    console.log(`❌ 系统PATH中未找到FFmpeg`)
  }

  console.log(`❌ 所有FFmpeg路径都不可用`)
  return null
}

// 检查当前 FFmpeg 目录结构
function checkFFmpegDirectory() {
  const ffmpegDir = path.join(__dirname, '../ffmpeg')

  console.log('\n📋 当前FFmpeg目录结构:')
  console.log('='.repeat(50))

  if (!fs.existsSync(ffmpegDir)) {
    console.log('❌ FFmpeg目录不存在')
    return
  }

  try {
    const items = fs.readdirSync(ffmpegDir)

    if (items.length === 0) {
      console.log('📁 FFmpeg目录为空')
      return
    }

    items.forEach(item => {
      const itemPath = path.join(ffmpegDir, item)
      const stats = fs.statSync(itemPath)

      if (stats.isDirectory()) {
        console.log(`📁 ${item}/`)

        // 检查是否包含 ffmpeg 可执行文件
        const possiblePaths = [
          path.join(itemPath, 'ffmpeg'),
          path.join(itemPath, 'ffmpeg.exe'),
          path.join(itemPath, 'bin', 'ffmpeg'),
          path.join(itemPath, 'bin', 'ffmpeg.exe')
        ]

        possiblePaths.forEach(execPath => {
          if (fs.existsSync(execPath)) {
            const execStats = fs.statSync(execPath)
            const isExecutable = (execStats.mode & parseInt('111', 8)) !== 0
            console.log(`   ${isExecutable ? '✅' : '⚠️'} ${path.relative(ffmpegDir, execPath)} ${isExecutable ? '(可执行)' : '(无执行权限)'}`)
          }
        })
      } else {
        console.log(`📄 ${item}`)
      }
    })
  } catch (error) {
    console.log(`❌ 读取目录失败: ${error.message}`)
  }
}

// 主测试函数
function runTests() {
  console.log('🧪 FFmpeg 路径测试开始')
  console.log('='.repeat(50))

  // 显示当前系统信息
  console.log(`🖥️  当前系统: ${process.platform} ${process.arch}`)

  // 检查 FFmpeg 目录结构
  checkFFmpegDirectory()

  // 测试所有平台和架构组合
  console.log('\n🔬 测试所有平台组合:')
  console.log('='.repeat(50))

  const results = []

  testCases.forEach(testCase => {
    const result = {
      ...testCase,
      dev: findFFmpegPath(testCase.platform, testCase.arch, false),
      prod: findFFmpegPath(testCase.platform, testCase.arch, true)
    }
    results.push(result)
  })

  // 显示测试结果摘要
  console.log('\n📊 测试结果摘要:')
  console.log('='.repeat(50))

  results.forEach(result => {
    const devStatus = result.dev ? '✅' : '❌'
    const prodStatus = result.prod ? '✅' : '❌'
    console.log(`${result.platform.padEnd(8)} ${result.arch.padEnd(6)} | 开发: ${devStatus} | 生产: ${prodStatus}`)
  })

  // 特别关注 Linux ARM64
  const linuxArm64 = results.find(r => r.platform === 'linux' && r.arch === 'arm64')
  if (linuxArm64) {
    console.log('\n🎯 Linux ARM64 详细结果:')
    console.log('='.repeat(50))
    console.log(`开发环境: ${linuxArm64.dev || '未找到'}`)
    console.log(`生产环境: ${linuxArm64.prod || '未找到'}`)

    if (!linuxArm64.dev && !linuxArm64.prod) {
      console.log('\n💡 建议:')
      console.log('1. 运行 `npm run setup:ffmpeg` 下载FFmpeg')
      console.log('2. 手动下载Linux ARM64版本的FFmpeg')
      console.log('3. 确保FFmpeg二进制文件有执行权限')
      console.log('4. 参考 docs/LINUX-ARM64-TROUBLESHOOTING.md')
    }
  }

  console.log('\n🏁 测试完成')
}

// 运行测试
if (require.main === module) {
  runTests()
}

module.exports = { findFFmpegPath, checkFFmpegDirectory, runTests }