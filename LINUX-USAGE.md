# Linux系统运行指南

## 📦 下载构建产物

从GitHub Actions构建完成后，你可以下载以下格式的Linux应用包：

- **`.AppImage`** - 便携式应用程序（推荐）
- **`.deb`** - Debian/Ubuntu系统安装包
- **`.tar.gz`** - 通用压缩包

## 🚀 运行方式

### 方式一：AppImage（推荐）

**优点：** 无需安装，直接运行，兼容性最好

```bash
# 1. 下载 .AppImage 文件到本地
# 2. 添加执行权限
chmod +x FireProtection-*.AppImage

# 3. 直接运行
./fireprotection-*.AppImage
```

### 方式二：DEB包安装

**适用于：** Debian、Ubuntu及其衍生发行版

```bash
# 安装deb包
sudo dpkg -i FireProtection-*.deb

# 如果有依赖问题，运行：
sudo apt-get install -f

# 运行应用（安装后可在应用菜单中找到）
fireprotection
```

### 方式三：TAR.GZ解压运行

**适用于：** 所有Linux发行版

```bash
# 1. 解压文件
tar -xzf FireProtection-*.tar.gz

# 2. 进入解压目录
cd fireprotection-*/

# 3. 添加执行权限
chmod +x fireprotection

# 4. 运行应用
./fireprotection
```

## 🔧 系统要求

### 最低要求
- **操作系统：** Linux (64位)
- **内存：** 4GB RAM
- **显卡：** 支持硬件加速的显卡（推荐）
- **网络：** 稳定的网络连接

### 依赖库
大多数现代Linux发行版已包含所需依赖，如遇到问题可安装：

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# CentOS/RHEL/Fedora
sudo yum install nss atk at-spi2-atk libdrm libXcomposite libXdamage libXrandr mesa-libgbm libXScrnSaver alsa-lib
```

## 🎯 使用说明

### 首次运行
1. 启动应用后，系统会自动检测网络环境
2. 配置设备连接参数（IP地址、端口等）
3. 开始监控消防设备状态

### 功能特性
- **实时监控：** 消防设备状态实时显示
- **视频流：** 支持海康威视等主流设备
- **数据记录：** 自动记录设备运行日志
- **报警提醒：** 异常情况及时通知

## 🐛 常见问题

### 1. 应用无法启动
```bash
# 检查是否有执行权限
ls -la fireprotection*

# 添加执行权限
chmod +x fireprotection*
```

### 2. 缺少依赖库
```bash
# 查看缺少的依赖
ldd fireprotection

# 安装缺少的库（以Ubuntu为例）
sudo apt-get install <missing-library>
```

### 3. 视频无法显示
- 确保网络连接正常
- 检查设备IP和端口配置
- 验证设备是否支持当前协议

### 4. 权限问题
```bash
# 如需访问特殊设备或端口，可能需要管理员权限
sudo ./fireprotection
```

## 📞 技术支持

如遇到其他问题，请：
1. 查看应用日志文件
2. 检查系统兼容性
3. 联系技术支持团队

---

**注意：** 建议优先使用AppImage格式，它具有最好的兼容性和便携性。