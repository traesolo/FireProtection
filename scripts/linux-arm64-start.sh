#!/bin/bash

# Linux ARM64 启动脚本 - 确保控制台日志输出可见
# 适用于消防设备终端应用

# 设置脚本错误时退出
set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# 应用信息
APP_NAME="消防设备终端"
EXECUTABLE="$APP_DIR/fireprotection"

# 日志配置
LOG_DIR="$HOME/.config/fireprotection/logs"
LOG_FILE="$LOG_DIR/startup-$(date +%Y-%m-%d).log"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 记录启动信息
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 启动 $APP_NAME" | tee -a "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 脚本目录: $SCRIPT_DIR" | tee -a "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 应用目录: $APP_DIR" | tee -a "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 可执行文件: $EXECUTABLE" | tee -a "$LOG_FILE"

# 检查架构
ARCH=$(uname -m)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 系统架构: $ARCH" | tee -a "$LOG_FILE"

# ARM64特定优化
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检测到ARM64架构，应用优化配置" | tee -a "$LOG_FILE"
    
    # 设置ARM64优化环境变量
    export ELECTRON_DISABLE_GPU=1
    export ELECTRON_NO_SANDBOX=1
    export ELECTRON_ENABLE_LOGGING=1
    export ELECTRON_LOG_LEVEL=0
    export LIBGL_ALWAYS_SOFTWARE=1
    export MESA_GL_VERSION_OVERRIDE=3.3
    export GALLIUM_DRIVER=llvmpipe
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ARM64环境变量已设置" | tee -a "$LOG_FILE"
fi

# 检查可执行文件是否存在
if [ ! -f "$EXECUTABLE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 错误: 找不到可执行文件 $EXECUTABLE" | tee -a "$LOG_FILE"
    exit 1
fi

# 设置可执行权限
chmod +x "$EXECUTABLE"

# 启动应用并重定向输出
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 启动应用..." | tee -a "$LOG_FILE"

# 使用exec替换当前进程，确保信号正确传递
# 同时将stdout和stderr都重定向到控制台和日志文件
exec "$EXECUTABLE" \
    --enable-logging \
    --log-level=0 \
    --v=1 \
    --no-sandbox \
    --disable-gpu \
    --disable-software-rasterizer \
    --disable-dev-shm-usage \
    --use-gl=swiftshader \
    2>&1 | tee -a "$LOG_FILE"