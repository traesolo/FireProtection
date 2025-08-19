# Linux系统运行指南

## 📦 下载构建产物

从GitHub Actions构建完成后，下载的是一个压缩包，解压后的目录结构如下：

```
linux-app-xxxxx/
└── 消防设备终端-1.0.0-x64/
    └── 消防设备终端-1.0.0-x64/
        ├── fireprotection          # 主要可执行文件
        ├── chrome_100_percent.pak
        ├── chrome_200_percent.pak
        ├── libEGL.so
        ├── libffmpeg.so
        └── ... (其他依赖文件)
```

**注意：** 实际构建产物是解压后的目录，不是单独的AppImage文件。

## 🚀 运行方式

### 方式一：直接运行（推荐）

**优点：** 无需安装，解压后直接运行

```bash
# 1. 解压下载的压缩包
unzip linux-app-*.zip
# 或者
tar -xzf linux-app-*.tar.gz

# 2. 进入应用目录（注意多层嵌套）
cd linux-app-*/消防设备终端-1.0.0-x64/消防设备终端-1.0.0-x64/

# 3. 添加执行权限
chmod +x fireprotection

# 4. 直接运行
./fireprotection
```

### 方式三：DEB包安装（如果有提供）

**适用于：** Debian、Ubuntu及其衍生发行版
**注意：** 当前构建主要提供解压版本，DEB包可能需要单独构建

```bash
# 如果有deb包，可以这样安装
sudo dpkg -i fireprotection-*.deb

# 如果有依赖问题，运行：
sudo apt-get install -f

# 运行应用
fireprotection
```

### 方式二：创建快捷方式（可选）

**适用于：** 方便日常使用

```bash
# 1. 将应用移动到合适位置
sudo mv 消防设备终端-1.0.0-x64 /opt/fireprotection

# 2. 创建系统链接
sudo ln -s /opt/fireprotection/fireprotection /usr/local/bin/fireprotection

# 3. 现在可以在任何地方运行
fireprotection
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
# 检查当前目录和文件权限
ls -la
pwd

# 确保在正确的目录中
cd linux-app-*/消防设备终端-1.0.0-x64/消防设备终端-1.0.0-x64/

# 添加执行权限
chmod +x fireprotection
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

### 4. 目录结构问题
```bash
# 如果找不到文件，检查目录结构
find . -name "fireprotection" -type f

# 或者查看完整目录结构
tree
# 没有tree命令可以用：
find . -type f | head -20
```

### 5. 权限问题
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