# Linux ARM64 控制台日志配置

本文档说明了消防设备终端在Linux ARM64环境下的控制台日志输出配置和使用方法。

## 概述

为了确保在Linux ARM64环境下（特别是嵌入式设备和一体机）能够正常查看应用程序的控制台输出，我们实现了以下功能：

1. **增强的控制台日志重定向**：确保日志同时输出到标准输出、标准错误和日志文件
2. **专用启动脚本**：针对ARM64架构的优化启动脚本
3. **构建时集成**：自动将启动脚本包含在打包结果中

## 功能特性

### 1. 控制台日志重定向

- **多重输出**：日志同时写入控制台和文件
- **缓冲区刷新**：强制刷新输出缓冲区，确保实时显示
- **错误分流**：错误信息输出到stderr，普通日志输出到stdout
- **时间戳**：所有日志都包含ISO格式的时间戳
- **日志级别**：支持log、error、warn、info四个级别

### 2. ARM64优化启动脚本

启动脚本 `linux-arm64-start.sh` 提供以下功能：

- **架构检测**：自动检测ARM64架构并应用优化配置
- **环境变量设置**：配置GPU禁用、软件渲染等ARM64特定设置
- **日志目录管理**：自动创建和管理日志目录
- **启动日志**：记录详细的启动信息和系统状态
- **错误处理**：检查可执行文件存在性和权限

### 3. 构建集成

- **自动复制**：构建时自动将启动脚本复制到输出目录
- **权限设置**：确保脚本具有执行权限
- **参数配置**：通过electron-builder配置启动参数

## 使用方法

### 构建Linux ARM64版本

```bash
# 构建Linux ARM64版本（包含启动脚本）
npm run electron:build:linux:arm64
```

### 在目标设备上运行

1. **解压安装包**：
   ```bash
   tar -xzf fireprotection-1.0.0-arm64.tar.gz
   cd fireprotection-1.0.0-arm64
   ```

2. **使用启动脚本运行**：
   ```bash
   # 方法1：直接运行启动脚本
   ./linux-arm64-start.sh
   
   # 方法2：给脚本执行权限后运行
   chmod +x linux-arm64-start.sh
   ./linux-arm64-start.sh
   ```

3. **直接运行可执行文件**（不推荐）：
   ```bash
   ./fireprotection
   ```

### 查看日志

1. **实时控制台输出**：
   启动脚本会将所有日志输出到控制台，可以直接查看

2. **日志文件**：
   - 应用日志：`~/.config/fireprotection/logs/app-YYYY-MM-DD.log`
   - 启动日志：`~/.config/fireprotection/logs/startup-YYYY-MM-DD.log`

3. **查看日志文件**：
   ```bash
   # 查看今天的应用日志
   tail -f ~/.config/fireprotection/logs/app-$(date +%Y-%m-%d).log
   
   # 查看启动日志
   cat ~/.config/fireprotection/logs/startup-$(date +%Y-%m-%d).log
   ```

## 配置说明

### Electron Builder配置

在 `electron-builder.json` 中的Linux配置：

```json
{
  "linux": {
    "executableArgs": [
      "--enable-logging",
      "--log-level=0",
      "--v=1",
      "--no-sandbox"
    ],
    "extraFiles": [
      {
        "from": "scripts/linux-arm64-start.sh",
        "to": "linux-arm64-start.sh"
      }
    ]
  }
}
```

### 环境变量

启动脚本会设置以下ARM64优化环境变量：

- `ELECTRON_DISABLE_GPU=1`：禁用GPU加速
- `ELECTRON_NO_SANDBOX=1`：禁用沙盒模式
- `ELECTRON_ENABLE_LOGGING=1`：启用日志
- `ELECTRON_LOG_LEVEL=0`：设置日志级别
- `LIBGL_ALWAYS_SOFTWARE=1`：强制软件渲染
- `MESA_GL_VERSION_OVERRIDE=3.3`：设置OpenGL版本
- `GALLIUM_DRIVER=llvmpipe`：使用LLVM管道驱动

## 故障排除

### 1. 控制台无输出

**问题**：运行应用后控制台没有任何输出

**解决方案**：
- 确保使用启动脚本运行：`./linux-arm64-start.sh`
- 检查脚本权限：`chmod +x linux-arm64-start.sh`
- 查看日志文件：`~/.config/fireprotection/logs/`

### 2. 启动脚本无法执行

**问题**：`bash: ./linux-arm64-start.sh: Permission denied`

**解决方案**：
```bash
chmod +x linux-arm64-start.sh
./linux-arm64-start.sh
```

### 3. 找不到可执行文件

**问题**：`错误: 找不到可执行文件`

**解决方案**：
- 确保在正确的目录中运行脚本
- 检查解压是否完整
- 验证文件结构是否正确

### 4. GPU相关错误

**问题**：出现GPU或OpenGL相关错误

**解决方案**：
- 启动脚本已自动禁用GPU加速
- 如果仍有问题，可以手动设置环境变量：
  ```bash
  export LIBGL_ALWAYS_SOFTWARE=1
  export ELECTRON_DISABLE_GPU=1
  ./fireprotection
  ```

## 验证安装

运行以下命令验证日志功能是否正常：

```bash
# 1. 运行应用
./linux-arm64-start.sh

# 2. 在另一个终端查看日志
tail -f ~/.config/fireprotection/logs/app-$(date +%Y-%m-%d).log

# 3. 检查启动信息
grep "消防设备终端启动" ~/.config/fireprotection/logs/app-$(date +%Y-%m-%d).log
```

如果看到类似以下输出，说明配置成功：

```
[2024-01-15T10:30:00.000Z] [LOG] === 消防设备终端启动 ===
[2024-01-15T10:30:00.001Z] [LOG] 控制台日志重定向已启用 - Linux ARM64兼容模式
[2024-01-15T10:30:00.002Z] [LOG] 系统架构: arm64
[2024-01-15T10:30:00.003Z] [LOG] 平台: linux
```

## 技术细节

### 日志重定向实现

应用程序在生产模式下会自动重定向所有console输出：

1. **捕获原始console方法**
2. **创建增强的writeLog函数**
3. **同时输出到stdout/stderr和文件**
4. **强制刷新缓冲区确保实时显示**
5. **保持原始console行为**

### ARM64特定优化

- **完全禁用GPU加速**：避免驱动兼容性问题
- **使用软件渲染**：确保在无GPU环境下正常运行
- **内存优化**：限制V8内存使用，适合低内存设备
- **禁用沙盒**：解决ARM64 Linux环境的权限问题

这些配置确保了应用程序在各种ARM64 Linux环境下都能稳定运行并提供可见的日志输出。