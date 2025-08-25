import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: './', // 使用相对路径，确保Electron中file://协议下正确加载
  publicDir: 'public', // 确保public目录下的文件被复制到构建输出

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@api': resolve(__dirname, 'src/api')
    }
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    cors: true,
    proxy: {
      '/fire-monitor': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:8061',
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', req.method, req.url, '-> 目标:', options.target + req.url);
            // 设置正确的请求头
            proxyReq.setHeader('Accept', 'application/json');
            // 对于文件上传接口，不设置Content-Type，让浏览器自动设置multipart/form-data
            if (!req.url.includes('/upload/')) {
              proxyReq.setHeader('Content-Type', 'application/json');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('代理响应:', proxyRes.statusCode, req.url);
            // 设置CORS响应头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'false';
          });
          proxy.on('error', (err, req, res) => {
            console.error('代理错误:', err.message, '请求:', req.url);
            if (res && !res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ error: '代理服务器错误', message: err.message }));
            }
          });
        }
      },
      // 图片资源代理配置
      '/home': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:8061',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('图片代理请求:', req.method, req.url, '-> 目标:', options.target + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('图片代理响应:', proxyRes.statusCode, req.url);
            // 设置CORS响应头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'false';
          });
          proxy.on('error', (err, req, res) => {
            console.error('图片代理错误:', err.message, '请求:', req.url);
            if (res && !res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ error: '图片代理服务器错误', message: err.message }));
            }
          });
        }
      },
      '/ws': {
        target: (process.env.VITE_API_TARGET || 'http://127.0.0.1:8061').replace('http', 'ws'),
        ws: true,
        changeOrigin: true
      },
      // 视频流代理配置 - 处理m3u8和ts文件
      '^/.*\.(m3u8|ts)$': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:8061',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('视频流代理请求:', req.method, req.url, '-> 目标:', options.target + req.url);
            // 设置视频流相关的请求头
            proxyReq.setHeader('Accept', '*/*');
            proxyReq.setHeader('Range', req.headers.range || '');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('视频流代理响应:', proxyRes.statusCode, req.url);
            // 设置视频流的CORS响应头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Range, Content-Range, Content-Length';
            proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'false';
            // 保持视频流的缓存控制
            if (req.url.includes('.m3u8')) {
              proxyRes.headers['Cache-Control'] = 'no-cache';
            }
          });
          proxy.on('error', (err, req, res) => {
            console.error('视频流代理错误:', err.message, '请求:', req.url);
            if (res && !res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
              });
              res.end('视频流代理服务器错误: ' + err.message);
            }
          });
        }
      }
    },
    hmr: {
      overlay: false
    }
  },

  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },

  optimizeDeps: {
    include: ['vue', 'vue-router', 'axios', 'pinia'],
    // 4核2G硬件优化：预构建优化
    force: false, // 避免强制重新预构建
    esbuildOptions: {
      target: 'es2015',
      // 限制esbuild使用的CPU核心数
      logLevel: 'error' // 减少日志输出
    }
  },

  // 4核2G硬件优化：开发服务器配置
  esbuild: {
    // 生产环境移除所有console和debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // 限制esbuild并发
    logLevel: 'error'
  }
})
