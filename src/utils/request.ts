import { useAuthStore } from '@/stores/authentication'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
  timeout: 10000, // 请求超时时间
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 store 中获取 token
    const authStore = useAuthStore()
    const token = authStore.token || localStorage.getItem('user_token')

    if (token) {
      config.headers.token = token
    }

    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 处理响应错误
    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 401:
          // token 过期或无效
          const authStore = useAuthStore()
          authStore.clearToken()
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error('请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  },
)

export default request
