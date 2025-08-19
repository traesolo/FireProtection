# 消防设备终端桌面应用部署指南

## 概述
本文档详细说明了消防设备终端桌面应用在Windows和Ubuntu系统上的部署流程。

## 系统要求

### Windows系统
- Windows 10/11 (64位)
- 至少4GB内存
- 至少2GB可用磁盘空间

### Ubuntu系统
- Ubuntu 18.04 LTS或更高版本 (64位)
- 至少4GB内存
- 至少2GB可用磁盘空间
- 支持图形界面(GUI)

## 开发环境准备

### 1. 安装Node.js
```bash
# Ubuntu系统
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 克隆项目并安装依赖
```bash
git clone <项目地址>
cd FireProtection
npm install
```

### 3. 开发环境测试
```bash
# 启动Web开发服务器
npm run dev

# 启动Electron开发环境
npm run electron:dev
```

## 构建生产版本

### Windows平台构建
```bash
# 仅构建Windows版本
npm run electron:build:win

# 构建结果位于: dist-electron/消防设备终端-1.0.0-setup.exe
```

### Ubuntu平台构建
```bash
# 仅构建Linux版本
npm run electron:build:linux

# 构建结果位于: 
# - dist-electron/消防设备终端-1.0.0.AppImage
# - dist-electron/消防设备终端_1.0.0_amd64.deb
```

### 跨平台构建
```bash
# 同时构建Windows和Linux版本
npm run electron:build:all
```

## Ubuntu系统部署流程

### 方法一：使用AppImage（推荐）

1. **下载AppImage文件**
   ```bash
   # 将构建生成的AppImage文件复制到目标Ubuntu机器
   scp dist-electron/消防设备终端-1.0.0.AppImage user@target-machine:/home/user/
   ```

2. **设置执行权限**
   ```bash
   chmod +x 消防设备终端-1.0.0.AppImage
   ```

3. **运行应用**
   ```bash
   ./消防设备终端-1.0.0.AppImage
   ```

4. **设置开机自启动**
   
   创建桌面文件：
   ```bash
   sudo nano /etc/xdg/autostart/fireprotection.desktop
   ```
   
   添加以下内容：
   ```ini
   [Desktop Entry]
   Type=Application
   Name=消防设备终端
   Comment=Fire Protection Equipment Terminal
   Exec=/home/user/消防设备终端-1.0.0.AppImage
   Icon=fireprotection
   Terminal=false
   StartupNotify=true
   Categories=Utility;System;
   X-GNOME-Autostart-enabled=true
   ```

### 方法二：使用DEB包

1. **安装DEB包**
   ```bash
   sudo dpkg -i 消防设备终端_1.0.0_amd64.deb
   
   # 如果有依赖问题，运行：
   sudo apt-get install -f
   ```

2. **运行应用**
   ```bash
   # 从应用菜单启动，或命令行启动
   消防设备终端
   ```

3. **设置开机自启动**
   
   DEB包安装后会自动创建桌面文件，只需启用自启动：
   ```bash
   # 使用gnome-session-properties（GNOME桌面）
   gnome-session-properties
   
   # 或编辑自启动配置
   mkdir -p ~/.config/autostart
   cp /usr/share/applications/fireprotection.desktop ~/.config/autostart/
   ```

## 全屏Kiosk模式配置

### Ubuntu系统Kiosk模式设置

1. **创建专用用户**
   ```bash
   sudo adduser kiosk
   sudo usermod -aG sudo kiosk
   ```

2. **配置自动登录**
   
   编辑GDM配置：
   ```bash
   sudo nano /etc/gdm3/custom.conf
   ```
   
   添加：
   ```ini
   [daemon]
   AutomaticLoginEnable=true
   AutomaticLogin=kiosk
   ```

3. **配置Kiosk会话**
   
   创建kiosk会话文件：
   ```bash
   sudo nano /usr/share/xsessions/kiosk.desktop
   ```
   
   添加：
   ```ini
   [Desktop Entry]
   Name=Kiosk
   Comment=Kiosk Session
   Exec=/home/kiosk/kiosk-session.sh
   Type=Application
   ```

4. **创建Kiosk启动脚本**
   ```bash
   nano /home/kiosk/kiosk-session.sh
   chmod +x /home/kiosk/kiosk-session.sh
   ```
   
   脚本内容：
   ```bash
   #!/bin/bash
   
   # 禁用屏保和电源管理
   xset s off
   xset -dpms
   xset s noblank
   
   # 隐藏鼠标光标（可选）
   unclutter -idle 0.5 -root &
   
   # 启动消防设备终端应用
   /home/kiosk/消防设备终端-1.0.0.AppImage
   ```

## 功能验证

### Ubuntu系统验证清单

1. **应用启动验证**
   - [ ] 应用能正常启动
   - [ ] 界面显示正常
   - [ ] 全屏模式工作正常

2. **功能验证**
   - [ ] 双监控区域显示正常
   - [ ] 设备状态监控正常
   - [ ] 告警信息显示正常
   - [ ] 退出按钮功能正常

3. **系统集成验证**
   - [ ] 开机自启动正常
   - [ ] Kiosk模式工作正常
   - [ ] 系统资源占用合理

## 故障排除

### 常见问题

1. **AppImage无法运行**
   ```bash
   # 安装FUSE支持
   sudo apt install fuse
   
   # 检查权限
   ls -la 消防设备终端-1.0.0.AppImage
   ```

2. **依赖库缺失**
   ```bash
   # 安装常用依赖
   sudo apt install libgtk-3-0 libgconf-2-4 libnss3 libxss1 libasound2
   ```

3. **全屏模式问题**
   ```bash
   # 检查窗口管理器设置
   gsettings set org.gnome.desktop.wm.preferences focus-mode 'click'
   ```

4. **自启动不工作**
   ```bash
   # 检查自启动文件
   ls -la ~/.config/autostart/
   
   # 查看系统日志
   journalctl -u gdm
   ```

## 安全注意事项

1. **系统安全**
   - 定期更新Ubuntu系统
   - 配置防火墙规则
   - 限制不必要的网络访问

2. **应用安全**
   - 使用专用用户运行应用
   - 限制文件系统访问权限
   - 定期备份配置文件

## 维护建议

1. **定期检查**
   - 监控系统资源使用情况
   - 检查应用日志文件
   - 验证网络连接状态

2. **更新流程**
   - 测试新版本兼容性
   - 备份当前配置
   - 逐步部署更新

---

**注意**: 本文档基于Ubuntu 20.04 LTS测试，其他版本可能需要适当调整配置步骤。