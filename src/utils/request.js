import axios from 'axios'

// 根据环境配置不同的API地址
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境：优先使用环境变量，否则使用默认的192.168.1.200
    return process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8061'
  } else {
    // 开发环境使用相对路径，通过Vite代理转发
    return ''
  }
}

// 创建axios实例
const request = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    console.log('发送请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    console.log('收到响应:', response.status, response.config.url)
    return response
  },
  error => {
    console.error('响应错误:', error.message, error.config?.url)
    if (error.code === 'ECONNREFUSED') {
      console.error('连接被拒绝，请检查服务器是否启动')
    }
    return Promise.reject(error)
  }
)

export default request