import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    base: './', // 设置相对路径，解决Electron应用打包后资源加载问题
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
                target: 'http://test.junhekh.cn:8061',
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
                target: 'http://test.junhekh.cn:8061',
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
                target: 'ws://test.junhekh.cn:8061',
                ws: true,
                changeOrigin: true
            }
        },
        hmr: {
            overlay: false
        }
    },

    build: {
        target: 'es2015',
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        // 4核2G硬件优化：减少构建时内存使用
        cssCodeSplit: true, // 启用CSS代码分割
        assetsInlineLimit: 2048, // 减小内联资源限制
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.warn'], // 移除更多console调用
                passes: 2 // 增加压缩轮数
            },
            mangle: {
                safari10: true // 兼容性优化
            }
        },
        rollupOptions: {
            // 4核2G硬件优化：更细粒度的代码分割
            output: {
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: '[ext]/[name]-[hash].[ext]',
                manualChunks(id) {
                    // 核心Vue相关
                    if (id.includes('vue') && !id.includes('node_modules')) {
                        return 'vue-core';
                    }
                    // Element Plus UI库
                    if (id.includes('element-plus')) {
                        return 'element-ui';
                    }
                    // 工具库
                    if (id.includes('axios') || id.includes('pinia')) {
                        return 'utils';
                    }
                    // 其他第三方库
                    if (id.includes('lodash') || id.includes('dayjs') || id.includes('echarts')) {
                        return 'vendor';
                    }
                    // 默认vendor chunk for node_modules
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                }
            },
            // 减少并发处理以适应4核CPU
            maxParallelFileOps: 2
        },
        chunkSizeWarningLimit: 300, // 降低chunk大小警告阈值
        reportCompressedSize: false, // 禁用压缩大小报告以节省构建时间
        // 4核2G硬件优化：限制构建时内存使用
        commonjsOptions: {
            dynamicRequireTargets: []
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
