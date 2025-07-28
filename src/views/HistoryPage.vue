<template>
  <div class="history-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">观看历史</h2>
      <div class="header-actions">
        <!-- 清除历史按钮 -->
        <!--之后看看要不要保留-->
        <el-button
          type="danger"
          plain
          size="small"
          @click="handleClearHistory"
        >
          清空历史
        </el-button>
        <!-- 搜索框 -->
        <!--之后看看要不要保留-->
        <!-- 这里可以使用handleSearch处理其他逻辑，searchKeyword变换也可以直接过滤 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索历史记录"
          class="search-input"
          clearable
          size="small"
          style="width: 200px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading-container"
    >
      <el-skeleton
        :rows="5"
        animated
      />
    </div>

    <!-- 历史记录列表 -->
    <div
      v-else-if="filteredHistoryData.length > 0"
      class="history-list"
    >
      <!-- 每天的观看记录 -->
      <div
        v-for="dayRecord in filteredHistoryData"
        :key="dayRecord.date"
        class="day-record"
      >
        <!-- 日期标题 -->
        <div class="date-header">
          <div class="date-info">
            <h3 class="date-title">{{ formatDate(dayRecord.date) }}</h3>
            <span class="video-count">共{{ dayRecord.videos.length }}个视频</span>
          </div>
          <!-- 当天记录操作 -->
          <div class="date-actions">
            <el-button
              type="text"
              size="small"
              @click="handleClearDayHistory(dayRecord.date)"
            >
              清除当天
            </el-button>
          </div>
        </div>

        <!-- 视频网格 -->
        <div class="videos-grid">
          <VideoCard
            v-for="video in dayRecord.videos"
            :key="video.video.id"
            :video="video.video"
            :uploader-name="video.uploaderName"
            :uploader-avatar="video.uploaderAvatar"
            :play-count="video.playCount"
            class="history-video-card"
            @click="handleVideoClick"
          />
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="empty-state"
    >
      <el-empty description="暂无观看历史">
        <el-button
          type="primary"
          @click="goHome"
        >去首页看看</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoCard from '@/components/videoCard/VideoCard.vue'
import type { UserProfile } from '@/types/entity/user'
import type { VideoCardInfo, VideoData } from '@/types/entity/video'
import request from '@/utils/request'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const VIDEO_SERVER_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API
const USER_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(true)
const searchKeyword = ref('')

interface DayRecord {
  date: string // YYYY-MM-DD 格式
  videos: VideoCardInfo[]
}

// 历史记录数据
const historyData = ref<DayRecord[]>([])

// 批量获取视频信息（参考 HomePage）
const getBatchVideoInfo = async (videoIds: number[]): Promise<Map<number, VideoData>> => {
  const videoInfoMap = new Map<number, VideoData>()

  if (videoIds.length === 0) {
    return videoInfoMap
  }

  try {
    const response = await request.post(`${VIDEO_SERVER_URL}/video/batch`, videoIds)

    if (response.data.code === 200 && response.data.data) {
      const videos = response.data.data

      videos.forEach((video: VideoData) => {
        videoInfoMap.set(video.id, video)
      })
    }
  } catch (error) {
    console.error('批量获取视频信息失败:', error)
  }

  return videoInfoMap
}

// 批量获取用户信息（参考 HomePage）
const userCache = ref<Map<number, UserProfile>>(new Map())

const getBatchUserInfo = async (userIds: number[]): Promise<Map<number, UserProfile>> => {
  const userInfoMap = new Map<number, UserProfile>()

  if (userIds.length === 0) {
    return userInfoMap
  }

  // 过滤出未缓存的用户ID
  const uncachedUserIds = userIds.filter(id => !userCache.value.has(id))

  // 如果所有用户信息都已缓存，直接返回
  if (uncachedUserIds.length === 0) {
    userIds.forEach(id => {
      if (userCache.value.has(id)) {
        userInfoMap.set(id, userCache.value.get(id)!)
      }
    })
    return userInfoMap
  }

  try {
    const response = await request.post(`${USER_SERVER_URL}/user/batch`, uncachedUserIds)

    if (response.data.code === 200 && response.data.data) {
      const userProfiles = response.data.data

      userProfiles.forEach((userInfo: UserProfile) => {
        userCache.value.set(userInfo.userId, userInfo)
        userInfoMap.set(userInfo.userId, userInfo)
      })
    }
  } catch (error) {
    console.error('批量获取用户信息失败:', error)
  }

  // 添加已缓存的用户信息到结果中
  userIds.forEach(id => {
    if (userCache.value.has(id) && !userInfoMap.has(id)) {
      userInfoMap.set(id, userCache.value.get(id)!)
    }
  })

  return userInfoMap
}

// 按日期分组视频
const groupVideosByDate = (videos: VideoCardInfo[]): DayRecord[] => {
  const groupedMap = new Map<string, VideoCardInfo[]>()

  videos.forEach(video => {
    // 从 createAt 提取日期部分
    const date = video.video.createAt.split('T')[0] || video.video.createAt.split(' ')[0]

    if (!groupedMap.has(date)) {
      groupedMap.set(date, [])
    }
    groupedMap.get(date)!.push(video)
  })

  // 转换为数组并按日期降序排序（最新的在前面）
  return Array.from(groupedMap.entries())
    .map(([date, videos]) => ({ date, videos }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// 加载历史记录
const loadHistory = async () => {
  try {
    loading.value = true

    // 获取用户观看历史的视频ID列表
    const response = await request.get(`${VIDEO_SERVER_URL}/video/video-views-history`)

    if (response.data.code !== 200) {
      console.error('加载历史记录失败:', response.data.message)
      ElMessage.error('加载历史记录失败')
      return
    }

    const videoIds: number[] = response.data.data || []
    console.log('历史视频ID列表:', videoIds)

    if (videoIds.length === 0) {
      historyData.value = []
      return
    }

    // 批量获取视频详细信息
    const videoInfoMap = await getBatchVideoInfo(videoIds)
    console.log('视频信息映射:', videoInfoMap)

    // 提取需要获取用户信息的用户ID
    const userIds = Array.from(new Set(
      Array.from(videoInfoMap.values()).map(video => video.userId)
    ))

    // 批量获取用户信息
    const userInfoMap = await getBatchUserInfo(userIds)
    console.log('用户信息映射:', userInfoMap)

    // 组装视频卡片数据
    const videoCardList: VideoCardInfo[] = videoIds.map(videoId => {
      const videoInfo = videoInfoMap.get(videoId)
      const userInfo = userInfoMap.get(videoInfo?.userId || 0)

      if (!videoInfo) {
        // 如果视频信息获取失败，跳过这个视频
        return null
      }

      return {
        video: videoInfo,
        uploaderName: userInfo?.nickname || `UP主_${videoInfo.userId}`,
        uploaderAvatar: userInfo?.avatar || '',
        playCount: Math.floor(Math.random() * 100000) // 模拟播放量
      } as VideoCardInfo
    }).filter(item => item !== null) as VideoCardInfo[]

    // 按日期分组
    historyData.value = groupVideosByDate(videoCardList)
    console.log('分组后的历史数据:', historyData.value)

  } catch (error) {
    console.error('获取历史记录失败:', error)
    if (axios.isAxiosError(error) && error.response) {
      console.error('获取信息失败:', error.response.data.message)
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
    } else {
      console.error('请求失败: 未知错误')
    }
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索过滤后的历史数据
const filteredHistoryData = computed(() => {
  if (!searchKeyword.value) {
    return historyData.value
  }

  return historyData.value.map(dayRecord => ({
    ...dayRecord,
    videos: dayRecord.videos.filter(video =>
      // 按标题搜索
      video.video.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      // 按日期搜索
      video.video.createAt.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  })).filter(dayRecord => dayRecord.videos.length > 0)
})

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天'
  } else {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    return date.toLocaleDateString('zh-CN', options)
  }
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 清空所有历史（保留功能但需要后端支持）
const handleClearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有观看历史吗？此操作无法撤销。',
      '清空历史',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // TODO: 调用后端API清空历史记录
    historyData.value = []
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消操作
  }
}

// 清空指定日期的历史（保留功能但需要后端支持）
const handleClearDayHistory = async (date: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要清空${formatDate(date)}的观看历史吗？`,
      '清空当天历史',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // TODO: 调用后端API清空指定日期的历史记录
    historyData.value = historyData.value.filter(item => item.date !== date)
    ElMessage.success('当天历史记录已清空')
  } catch {
    // 用户取消操作
  }
}

// 视频点击处理
const handleVideoClick = (video: VideoData) => {
  router.push(`/index/video/${video.id}`)
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 组件挂载时加载数据
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loading-container {
  padding: 20px;
}

.day-record {
  margin-bottom: 32px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #374151;
}

.video-count {
  font-size: 14px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 12px;
}

.date-actions .el-button {
  color: #ef4444;
}

.date-actions .el-button:hover {
  color: #dc2626;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

.history-video-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.history-video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .header-actions .search-input {
    width: 180px !important;
  }

  .date-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .date-actions {
    align-self: flex-end;
  }

  .videos-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .page-header .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .page-header .header-actions .search-input {
    width: 100% !important;
  }
}
</style>
