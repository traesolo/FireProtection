# Linux 构建指南

## 问题描述

在 Windows 系统上直接构建 Linux 包时会遇到错误，这是因为 electron-builder 需要 Linux 环境来构建 Linux 特定的包格式（如 .deb、.AppImage 等）。

## 解决方案

### 方案一：使用 Docker（推荐）

1. **安装 Docker Desktop**
   - 下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
   - 确保 Docker 服务正在运行

2. **使用 Docker 构建**
   ```bash
   npm run electron:build:linux:docker
   ```

   或者手动执行：
   ```bash
   npm run build
   docker run --rm -ti -v %cd%:/project -w /project electronuserland/builder:wine electron-builder --linux
   ```

### 方案二：使用远程构建服务

1. **启用远程构建**
   - 在 `electron-builder.json` 中设置 `"remoteBuild": true`
   - 这将使用 Electron Build Service 进行构建

2. **注意事项**

## 远程构建方案

由于在Windows上构建的Linux应用可能存在二进制格式问题，推荐使用以下远程构建方案：

### 方案一：GitHub Actions 自动构建

1. **创建 GitHub Actions 工作流**
   在项目根目录创建 `.github/workflows/build-linux.yml`：

   ```yaml
   name: Build Linux App
   
   on:
     push:
       branches: [ main, master ]
     pull_request:
       branches: [ main, master ]
     workflow_dispatch:
   
   jobs:
     build-linux:
       runs-on: ubuntu-latest
       
       steps:
       - uses: actions/checkout@v3
       
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           cache: 'npm'
       
       - name: Install dependencies
         run: npm ci
       
       - name: Build frontend
         run: npm run build
       
       - name: Build Linux app
         run: npx electron-builder --linux
       
       - name: Upload artifacts
         uses: actions/upload-artifact@v3
         with:
           name: linux-app
           path: dist-electron/*.tar.gz
   ```

2. **使用步骤**：
   - 将代码推送到GitHub仓库
   - GitHub Actions会自动构建Linux应用
   - 在Actions页面下载构建好的应用包

### 方案二：使用云服务器构建

1. **准备云服务器**（推荐Ubuntu 20.04+）
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 安装构建依赖
   sudo apt-get install -y build-essential git
   ```

2. **上传项目并构建**
   ```bash
   # 克隆或上传项目
   git clone <your-repo-url>
   cd FireProtection
   
   # 安装依赖
   npm install
   
   # 构建前端
   npm run build
   
   # 构建Linux应用
   npx electron-builder --linux
   
   # 下载构建结果
   scp user@server:/path/to/project/dist-electron/*.tar.gz ./
   ```

### 方案三：Docker 跨平台构建（推荐）

1. **创建多平台构建脚本**
   创建 `scripts/build-linux-remote.js`：

   ```javascript
   const { execSync } = require('child_process');
   const path = require('path');
   
   console.log('开始远程Linux构建...');
   
   try {
     // 使用Docker buildx进行跨平台构建
     execSync(`docker buildx build --platform linux/amd64 -t fireprotection-builder .`, {
       stdio: 'inherit',
       cwd: process.cwd()
     });
     
     // 运行构建容器
     execSync(`docker run --rm -v "${process.cwd()}:/workspace" fireprotection-builder`, {
       stdio: 'inherit'
     });
     
     console.log('Linux应用构建完成！');
   } catch (error) {
     console.error('构建失败:', error.message);
     process.exit(1);
   }
   ```

2. **创建 Dockerfile**：
   ```dockerfile
   FROM node:18-alpine
   
   # 安装构建依赖
   RUN apk add --no-cache \
       python3 \
       make \
       g++ \
       git
   
   WORKDIR /workspace
   
   # 复制package文件
   COPY package*.json ./
   
   # 安装依赖
   RUN npm ci
   
   # 构建命令
   CMD ["sh", "-c", "npm run build && npx electron-builder --linux"]
   ```

### 方案四：WSL2 构建（本地方案）

如果您有WSL2环境：

```bash
# 在WSL2中执行
cd /mnt/d/MyWork/web端/FireProtection

# 安装Node.js（如果未安装）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装依赖
npm install

# 构建
npm run build
npx electron-builder --linux
```
   - 远程构建服务可能需要网络连接
   - 构建速度取决于网络状况

### 方案三：跨平台构建环境

如果需要经常构建多平台包，建议使用 CI/CD 服务：

- **GitHub Actions**: 可以同时构建 Windows、macOS 和 Linux
- **Travis CI**: 支持多平台构建
- **AppVeyor**: 主要用于 Windows 构建

## 当前配置

项目已配置支持以下构建命令：

- `npm run electron:build:win` - 构建 Windows 包
- `npm run electron:build:linux` - 直接构建 Linux 包（可能在 Windows 上失败）
- `npm run electron:build:linux:docker` - 使用 Docker 构建 Linux 包
- `npm run electron:build:all` - 构建所有平台包

## 输出文件

构建成功后，Linux 包将输出到：
- `dist-electron/` 目录
- 包含 `.deb` 和 `.AppImage` 格式的安装包

## 故障排除

1. **Docker 相关错误**
   - 确保 Docker Desktop 正在运行
   - 检查 Docker 是否有足够的磁盘空间
   - 尝试重启 Docker 服务

2. **权限错误**
   - 确保当前用户有 Docker 执行权限
   - 在管理员模式下运行命令提示符

3. **网络连接问题**
   - 检查防火墙设置
   - 确保可以访问 Docker Hub

4. **Linux应用无法启动问题**
   - **格式错误**：这是最常见的问题，通常是因为在Windows上构建导致的
     ```bash
     # 检查文件格式
     file fireprotection
     
     # 如果显示格式错误，需要重新构建或使用正确的Linux构建环境
     ```
     **解决方案**：
     - 使用Docker在Linux环境中重新构建
     - 或者在真实的Linux系统上构建应用
     
   - **权限问题**：确保 `fireprotection` 文件有执行权限
     ```bash
     chmod +x fireprotection
     ```
   - **依赖库缺失**：安装必要的系统依赖
     ```bash
     # Ubuntu/Debian
     sudo apt-get update
     sudo apt-get install libgtk-3-0 libgbm1 libasound2
     
     # CentOS/RHEL
     sudo yum install gtk3 libXScrnSaver alsa-lib
     ```
   - **显示问题**：如果是无头服务器，需要虚拟显示
     ```bash
     sudo apt-get install xvfb
     xvfb-run -a ./fireprotection
     ```
   - **检查错误日志**：在终端中运行查看详细错误信息
     ```bash
     ./fireprotection --verbose
     ```

5. **重新构建解决格式错误**
   如果遇到格式错误，建议使用以下方法重新构建：
   
   **方法一：使用Docker重新构建**
   ```bash
   # 清理之前的构建
   rm -rf dist-electron
   
   # 使用Docker重新构建
   docker run --rm -v "$(pwd)":/project -w /project electronuserland/builder:wine /bin/bash -c "npm install && npx electron-builder --linux"
   ```
   
   **方法二：在Linux虚拟机中构建**
   - 在Ubuntu/CentOS虚拟机中克隆项目
   - 安装Node.js和npm
   - 运行构建命令