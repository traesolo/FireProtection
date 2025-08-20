# 消防监控系统 (Fire Protection Monitoring System)

基于 Vue 3 + Vite + Electron 的消防监控系统，支持实时视频流监控、设备状态监测和数据可视化。

## 功能特性

- 🎥 **实时视频监控**：支持 RTSP 视频流接入和 HLS 播放
- 📊 **数据可视化**：实时显示消防设备状态和监测数据
- 🖥️ **跨平台支持**：支持 Windows、Linux、macOS 多平台部署
- 🏗️ **ARM64 兼容**：完整支持 ARM64 架构（包括 Apple Silicon 和 Linux ARM64）
- 📱 **响应式设计**：适配不同屏幕尺寸的设备

## 技术栈

- **前端**：Vue 3, Vite, Element Plus
- **桌面端**：Electron
- **视频处理**：FFmpeg, HLS.js
- **构建工具**：GitHub Actions

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 设置 FFmpeg（首次运行）
npm run setup:ffmpeg

# 启动开发服务器
npm run dev

# 启动 Electron 开发环境
npm run electron:dev
```

### 生产构建

```bash
# 构建 Web 应用
npm run build

# 构建 Electron 应用
npm run electron:build

# 构建特定平台
npm run electron:build:win
npm run electron:build:linux
npm run electron:build:mac
```

## 故障排除

### Linux ARM64 构建问题

如果在 Linux ARM64 环境下遇到 `ENOTDIR` 错误或 FFmpeg 相关问题，请参考：

📖 **[Linux ARM64 故障排除指南](./docs/LINUX-ARM64-TROUBLESHOOTING.md)**

### 常见问题

- **视频流无法播放**：检查 FFmpeg 安装和摄像头连接
- **构建失败**：确保已正确安装所有依赖
- **权限错误**：检查 FFmpeg 二进制文件的执行权限

## 项目结构

```
├── src/                    # 前端源码
│   ├── views/             # 页面组件
│   ├── utils/             # 工具函数
│   └── config/            # 配置文件
├── electron/              # Electron 主进程
├── ffmpeg/                # FFmpeg 二进制文件
├── docs/                  # 项目文档
├── .github/workflows/     # CI/CD 配置
└── scripts/               # 构建脚本
```

## 支持的平台

| 平台 | 架构 | 状态 |
|------|------|------|
| Windows | x64 | ✅ 支持 |
| Windows | ARM64 | ⚠️ 有限支持 |
| Linux | x64 | ✅ 支持 |
| Linux | ARM64 | ✅ 支持 |
| macOS | x64 | ✅ 支持 |
| macOS | ARM64 | ✅ 支持 |

## 开发指南

### 添加新的监控设备

1. 在 `src/config/` 中添加设备配置
2. 更新 `src/views/Home.vue` 中的设备列表
3. 测试设备连接和数据显示

### 视频流处理

视频流现在直接从接口获取HLS流URL，使用hls.js库进行播放。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE)
