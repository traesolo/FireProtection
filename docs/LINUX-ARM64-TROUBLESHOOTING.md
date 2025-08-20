# Linux ARM64 构建问题排查指南

## 问题描述

在 Linux ARM64 环境下构建和运行应用时，可能会遇到以下错误：

```
Error: spawn ENOTDIR
```

这个错误通常发生在视频流启动时，表示 FFmpeg 路径配置错误或 FFmpeg 二进制文件缺失。

## 错误原因

1. **FFmpeg 二进制文件缺失**：Linux ARM64 架构的 FFmpeg 二进制文件未正确下载或安装
2. **路径配置错误**：FFmpeg 路径指向不存在的目录或文件
3. **权限问题**：FFmpeg 二进制文件没有执行权限
4. **架构不匹配**：尝试在 ARM64 系统上运行 AMD64 版本的 FFmpeg

## 解决方案

### 1. 自动解决方案（推荐）

项目已经更新了构建脚本和错误处理逻辑：

- **构建时自动下载**：`.github/workflows/build-linux-arm64.yml` 会自动下载对应的 FFmpeg 版本
- **智能回退机制**：如果 ARM64 版本不可用，会自动尝试使用 AMD64 版本或系统 FFmpeg
- **详细错误提示**：应用会提供具体的错误信息和解决建议

### 2. 手动解决方案

#### 方法一：手动下载 FFmpeg ARM64 版本

```bash
# 进入项目目录
cd /path/to/your/project

# 创建 ffmpeg 目录
mkdir -p ffmpeg
cd ffmpeg

# 下载 Linux ARM64 静态版本
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz

# 解压
tar -xf ffmpeg-release-arm64-static.tar.xz

# 重命名为项目期望的目录名
mv ffmpeg-*-arm64-static ffmpeg-7.0.2-arm64-static

# 设置执行权限
chmod +x ffmpeg-7.0.2-arm64-static/ffmpeg

# 清理下载文件
rm ffmpeg-release-arm64-static.tar.xz
```

#### 方法二：使用系统 FFmpeg

```bash
# 安装系统 FFmpeg
sudo apt update
sudo apt install ffmpeg

# 验证安装
ffmpeg -version
```

#### 方法三：使用 AMD64 版本（兼容性模式）

如果 ARM64 版本不可用，可以尝试使用 AMD64 版本：

```bash
cd ffmpeg

# 下载 AMD64 版本
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
mv ffmpeg-*-amd64-static ffmpeg-7.0.2-amd64-static
chmod +x ffmpeg-7.0.2-amd64-static/ffmpeg
rm ffmpeg-release-amd64-static.tar.xz
```

### 3. 验证解决方案

```bash
# 检查 FFmpeg 目录结构
ls -la ffmpeg/

# 应该看到类似以下结构：
# ffmpeg-7.0.2-arm64-static/
# 或 ffmpeg-7.0.2-amd64-static/

# 测试 FFmpeg 可执行性
./ffmpeg/ffmpeg-7.0.2-arm64-static/ffmpeg -version
# 或
./ffmpeg/ffmpeg-7.0.2-amd64-static/ffmpeg -version
```

## 构建配置更新

项目已更新以下文件来解决此问题：

### 1. 主进程错误处理 (`electron/main.cjs`)

- 添加了 FFmpeg 目录存在性检查
- 实现了智能回退机制（ARM64 → AMD64 → 系统 FFmpeg）
- 提供了详细的错误日志和诊断信息

### 2. 构建脚本 (`.github/workflows/build-linux-arm64.yml`)

- 自动下载 Linux ARM64 版本的 FFmpeg
- 如果下载失败，自动回退到 AMD64 版本
- 设置正确的文件权限

### 3. 前端错误处理 (`src/views/Home.vue`)

- 针对 `ENOTDIR` 错误提供具体的解决建议
- 区分不同类型的 FFmpeg 相关错误
- 提供用户友好的错误信息

## 预防措施

1. **使用自动构建**：推荐使用 GitHub Actions 进行构建，会自动处理 FFmpeg 依赖
2. **检查构建日志**：构建时注意查看 FFmpeg 下载和设置的日志信息
3. **本地测试**：在本地 ARM64 环境中测试应用功能
4. **备用方案**：确保系统安装了 FFmpeg 作为备用

## 常见问题

### Q: 为什么会出现 ENOTDIR 错误？
A: 这通常是因为代码尝试访问一个不存在的目录，或者路径指向了一个文件而不是目录。在 Linux ARM64 构建中，最常见的原因是缺少对应架构的 FFmpeg 二进制文件。

### Q: AMD64 版本的 FFmpeg 能在 ARM64 系统上运行吗？
A: 在某些情况下可以，特别是在支持多架构模拟的环境中。但性能可能会受到影响，建议优先使用原生 ARM64 版本。

### Q: 如何确认当前系统架构？
A: 使用以下命令：
```bash
uname -m  # 显示机器架构
arch      # 显示架构信息
```

### Q: 构建成功但运行时仍然报错怎么办？
A: 检查以下几点：
1. FFmpeg 文件是否有执行权限
2. 依赖库是否完整
3. 系统是否支持该架构的二进制文件
4. 查看应用日志获取详细错误信息

## 联系支持

如果按照上述步骤仍无法解决问题，请提供以下信息：

1. 系统架构信息 (`uname -a`)
2. FFmpeg 目录结构 (`ls -la ffmpeg/`)
3. 完整的错误日志
4. 构建环境信息

这将帮助快速定位和解决问题。