# 消防设备终端 - 4核2G硬件部署指南

## 项目概述

消防设备终端是一款专为一体机设计的桌面应用，支持开机自启动、全屏运行，用于监控消防设备状态和告警信息。本应用已针对4核2G硬件配置进行深度优化。

## 系统要求

### 硬件要求
- **CPU**: 4核心处理器（推荐2.0GHz+）
- **内存**: 2GB RAM（最低），4GB RAM（推荐）
- **存储**: 1GB 可用空间
- **网络**: 稳定的网络连接

### 操作系统支持
- Windows 10/11 (x64)
- Ubuntu 18.04+ (x64)
- 其他基于Debian的Linux发行版

## 性能优化特性

### Electron 应用优化
- ✅ V8引擎内存限制为1GB
- ✅ 禁用后台定时器节流
- ✅ 禁用渲染器后台化
- ✅ 禁用WebGL以节省GPU内存
- ✅ 禁用HTTP缓存减少内存占用
- ✅ 优化代码分割和打包体积

### 构建优化
- ✅ 最大压缩打包体积
- ✅ 细粒度代码分割
- ✅ 移除开发依赖
- ✅ 限制并发处理数量
- ✅ 优化资源加载

## 构建和打包

### 开发环境准备
```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# Electron开发模式
npm run electron:dev
```

### 生产环境构建
```bash
# 构建前端资源
npm run build

# 打包Windows版本
npm run electron:build:win

# 打包Linux版本
npm run electron:build:linux

# 打包所有平台
npm run electron:build:all
```

## 部署流程

### Windows 一体机部署

#### 1. 准备工作
```bash
# 检查系统资源
# 确保可用内存 >= 1.5GB
# 确保可用存储 >= 1GB
# 关闭不必要的后台应用
```

#### 2. 安装应用
1. 运行 `消防设备终端-x.x.x-x64-setup.exe`
2. 选择安装目录（推荐默认路径）
3. 勾选"创建桌面快捷方式"
4. 勾选"开机自启动"
5. 完成安装

#### 3. 首次启动验证
- 应用应在30秒内启动
- 自动进入全屏模式
- 显示双监控区域界面
- 内存使用应在800MB-1.2GB之间

### Ubuntu 一体机部署

#### 1. 使用DEB包安装
```bash
# 安装DEB包
sudo dpkg -i 消防设备终端-x.x.x-x64.deb

# 解决依赖问题（如有）
sudo apt-get install -f

# 设置开机自启动
sudo systemctl enable fire-protection-terminal
```

#### 2. 使用AppImage运行
```bash
# 给予执行权限
chmod +x 消防设备终端-x.x.x-x64.AppImage

# 运行应用
./消防设备终端-x.x.x-x64.AppImage

# 设置开机自启动
mkdir -p ~/.config/autostart
cp fire-protection-terminal.desktop ~/.config/autostart/
```

## 性能监控和优化

### 系统监控指标

#### 正常运行指标
- **内存使用**: 800MB - 1.2GB
- **CPU使用率**: < 50%
- **启动时间**: < 30秒
- **响应时间**: < 2秒

#### 监控命令
```bash
# Windows - 任务管理器
# 或使用PowerShell
Get-Process "消防设备终端" | Select-Object ProcessName, CPU, WorkingSet

# Linux - 系统监控
top -p $(pgrep -f "fire-protection")
htop -p $(pgrep -f "fire-protection")
```

### 系统级优化

#### Windows 优化
```powershell
# 设置高性能电源计划
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

# 禁用Windows更新自动重启
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" /v NoAutoRebootWithLoggedOnUsers /t REG_DWORD /d 1

# 优化虚拟内存
# 设置为物理内存的1.5倍（3GB）
```

#### Ubuntu 优化
```bash
# 优化交换分区使用
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# 限制系统日志大小
sudo journalctl --vacuum-size=100M

# 禁用不必要的服务
sudo systemctl disable bluetooth cups

# 设置CPU调度器为性能模式
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## 故障排除

### 常见问题及解决方案

#### 1. 应用启动缓慢（>30秒）
**原因分析**:
- 系统内存不足
- 磁盘空间不足
- 后台应用占用资源

**解决方案**:
```bash
# 检查系统资源
# Windows
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory
dir C:\ | findstr "bytes free"

# Linux
free -h
df -h

# 清理系统
# 关闭不必要的应用
# 清理临时文件
# 重启系统
```

#### 2. 内存使用过高（>1.5GB）
**原因分析**:
- 内存泄漏
- 数据量过大
- 系统资源竞争

**解决方案**:
```bash
# 重启应用
# 检查系统其他进程
# 升级系统内存到4GB
# 联系技术支持
```

#### 3. 应用无响应或卡顿
**原因分析**:
- CPU使用率过高
- 网络连接问题
- 磁盘I/O瓶颈

**解决方案**:
```bash
# 检查网络连接
ping 8.8.8.8

# 检查磁盘使用
# Windows: chkdsk C: /f
# Linux: fsck /dev/sda1

# 重启网络服务
# 重启应用
```

### 日志收集

#### 应用日志位置
```bash
# Windows
%APPDATA%\消防设备终端\logs\

# Linux
~/.config/消防设备终端/logs/
```

#### 系统日志收集
```bash
# Windows事件日志
eventvwr.msc

# Linux系统日志
sudo journalctl -u fire-protection-terminal
sudo dmesg | tail -50
```

## 维护建议

### 定期维护任务

#### 每日检查
- [ ] 应用正常运行
- [ ] 内存使用正常
- [ ] 网络连接稳定

#### 每周维护
- [ ] 重启应用
- [ ] 检查系统更新
- [ ] 清理临时文件

#### 每月维护
- [ ] 系统完整重启
- [ ] 磁盘空间清理
- [ ] 性能数据分析
- [ ] 备份重要数据

### 备份策略

#### 配置文件备份
```bash
# 备份应用配置
# Windows
copy "%APPDATA%\消防设备终端\config\*" "D:\backup\config\"

# Linux
cp -r ~/.config/消防设备终端/config/ ~/backup/
```

#### 数据备份
```bash
# 备份应用数据
# 定期导出设备状态数据
# 备份告警历史记录
```

## 技术支持

### 联系信息
- 技术支持邮箱: support@fireprotection.com
- 紧急联系电话: 400-xxx-xxxx
- 在线文档: https://docs.fireprotection.com

### 问题报告
提交问题时请提供:
1. 系统配置信息
2. 应用版本号
3. 错误截图或日志
4. 问题复现步骤
5. 性能监控数据

---

**版本**: v1.0.0  
**更新时间**: 2024年1月  
**适用硬件**: 4核2G一体机  
**维护团队**: 消防设备终端开发组