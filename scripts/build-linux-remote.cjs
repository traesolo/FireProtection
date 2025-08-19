const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 开始远程Linux构建...');

function runCommand(command, options = {}) {
  try {
    console.log(`执行命令: ${command}`);
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
  } catch (error) {
    console.error(`❌ 命令执行失败: ${command}`);
    throw error;
  }
}

function checkDockerInstalled() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  try {
    // 检查Docker是否安装
    if (!checkDockerInstalled()) {
      console.error('❌ Docker未安装，请先安装Docker Desktop');
      process.exit(1);
    }

    // 检查Dockerfile是否存在
    if (!fs.existsSync('Dockerfile')) {
      console.error('❌ Dockerfile不存在，请确保项目根目录有Dockerfile');
      process.exit(1);
    }

    console.log('📦 构建Docker镜像...');
    runCommand('docker build -t fireprotection-builder .');

    console.log('🔨 在Docker容器中构建Linux应用...');
    const volumeMount = process.platform === 'win32'
      ? `"${process.cwd().replace(/\\/g, '/')}:/workspace"`
      : `"${process.cwd()}:/workspace"`;

    runCommand(`docker run --rm -v ${volumeMount} fireprotection-builder`);

    console.log('✅ Linux应用构建完成！');
    console.log('📁 构建文件位置: dist-electron/');

    // 列出构建结果
    if (fs.existsSync('dist-electron')) {
      const files = fs.readdirSync('dist-electron').filter(f => f.endsWith('.tar.gz'));
      if (files.length > 0) {
        console.log('🎉 构建的文件:');
        files.forEach(file => {
          const filePath = path.join('dist-electron', file);
          const stats = fs.statSync(filePath);
          console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

main();