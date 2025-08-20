const fs = require('fs')
const path = require('path')
const https = require('https')
const { execSync } = require('child_process')

// FFmpeg下载配置
const FFMPEG_DOWNLOADS = {
  // Windows
  'win32-x64': {
    url: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
    dir: 'ffmpeg-7.1.1-essentials_build',
    extract: true
  },
  'win32-arm64': {
    url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    dir: 'ffmpeg-7.1.1-win-arm64',
    extract: true,
    note: 'Windows ARM64 builds are limited, using x64 build as fallback'
  },
  // Linux
  'linux-x64': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    dir: 'ffmpeg-7.0.2-amd64-static',
    extract: true
  },
  'linux-arm64': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
    dir: 'ffmpeg-7.0.2-arm64-static',
    extract: true
  },
  // macOS
  'darwin-x64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip',
    dir: 'ffmpeg-7.0.2-macos-x64',
    extract: true
  },
  'darwin-arm64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip',
    dir: 'ffmpeg-7.0.2-macos-arm64',
    extract: true,
    note: 'macOS ARM64 uses universal binary'
  }
}

const ffmpegDir = path.join(__dirname, '../ffmpeg')

// 确保ffmpeg目录存在
if (!fs.existsSync(ffmpegDir)) {
  fs.mkdirSync(ffmpegDir, { recursive: true })
}

// 创建README文件说明
const readmeContent = `# FFmpeg 二进制文件

本目录包含用于不同平台和架构的FFmpeg二进制文件：

## 支持的平台和架构

### Windows
- x64: ffmpeg-7.1.1-essentials_build/
- arm64: ffmpeg-7.1.1-win-arm64/ (注意：Windows ARM64支持有限)

### Linux
- x64: ffmpeg-7.0.2-amd64-static/
- arm64: ffmpeg-7.0.2-arm64-static/

### macOS
- x64: ffmpeg-7.0.2-macos-x64/
- arm64: ffmpeg-7.0.2-macos-arm64/

## 使用说明

这些二进制文件由构建脚本自动下载和管理。
应用程序会根据运行时的平台和架构自动选择合适的版本。

## 注意事项

1. 这些文件较大，已在.gitignore中排除
2. 构建时需要确保对应架构的二进制文件存在
3. 跨平台构建时需要下载目标平台的二进制文件

## 手动下载

如果自动下载失败，可以手动从以下地址下载：

- Windows: https://www.gyan.dev/ffmpeg/builds/
- Linux: https://johnvansickle.com/ffmpeg/
- macOS: https://evermeet.cx/ffmpeg/
`

fs.writeFileSync(path.join(ffmpegDir, 'README.md'), readmeContent)

console.log('FFmpeg二进制文件下载脚本已准备就绪')
console.log('注意：由于文件较大，建议手动下载所需的二进制文件')
console.log('下载地址已在README.md中列出')

// 检查现有文件
const existingDirs = fs.readdirSync(ffmpegDir).filter(item => {
  const itemPath = path.join(ffmpegDir, item)
  return fs.statSync(itemPath).isDirectory()
})

console.log('\n当前已有的FFmpeg目录：')
existingDirs.forEach(dir => {
  console.log(`  - ${dir}`)
})

console.log('\n需要的FFmpeg目录：')
Object.values(FFMPEG_DOWNLOADS).forEach(config => {
  const exists = existingDirs.includes(config.dir)
  console.log(`  ${exists ? '✓' : '✗'} ${config.dir}`)
})