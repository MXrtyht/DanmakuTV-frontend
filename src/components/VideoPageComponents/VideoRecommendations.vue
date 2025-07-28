<template>
  <div class="video-recommendations">
    <!-- 标题 -->
    <div class="recommendations-header">
      <h3 class="recommendations-title">相关推荐</h3>
    </div>

    <!-- 推荐视频列表 -->
    <div class="recommendations-list">
      <div
        v-for="video in recommendations"
        :key="video.id"
        class="recommendation-item"
        @click="handleVideoClick(video)"
      >
        <!-- 视频封面 -->
        <div class="video-cover">
          <el-image
            :src="video.coverUrl"
            :alt="video.title"
            class="cover-image"
            fit="cover"
            lazy
          >
            <template #placeholder>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          
          <!-- 时长标签 -->
          <div v-if="video.duration" class="duration-tag">
            {{ formatDuration(video.duration) }}
          </div>
        </div>

        <!-- 视频信息 -->
        <div class="video-info">
          <!-- 标题 -->
          <h4 class="video-title" :title="video.title">
            {{ video.title }}
          </h4>
          
          <!-- UP主信息 -->
          <div class="uploader-info">
            <span class="uploader-name">{{ video.uploaderName }}</span>
          </div>
          
          <!-- 播放量 -->
          <div class="video-meta">
            <span class="play-count">{{ formatPlayCount(video.playCount) }}播放</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="recommendations.length === 0 && !loading" class="empty-recommendations">
        <el-empty description="暂无相关推荐" />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-recommendations">
        <el-skeleton :rows="3" animated />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import request from '@/utils/request'
import type { VideoData } from '@/types/entity/video'

// Props
interface Props {
  videoId: number
  tags?: string[] // 当前视频的标签，用于推荐
}

const props = defineProps<Props>()

// 路由
const router = useRouter()

// 推荐视频展示数据类型
interface RecommendationVideo {
  id: number
  title: string
  coverUrl: string
  duration: number
  uploaderName: string
  playCount: number
  createAt: string
}

// 响应式数据
const recommendations = ref<RecommendationVideo[]>([])
const loading = ref(false)

// 环境变量
const VIDEO_SERVER_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API
const USER_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API

// 用户信息缓存
const userCache = ref<Map<number, { nickname: string }>>(new Map())

// 批量获取用户信息
const getBatchUserInfo = async (userIds: number[]): Promise<Map<number, { nickname: string }>> => {
  const userInfoMap = new Map<number, { nickname: string }>()
  
  // 过滤出未缓存的用户ID
  const uncachedUserIds = userIds.filter(id => !userCache.value.has(id))
  
  // 添加已缓存的用户信息
  userIds.forEach(id => {
    if (userCache.value.has(id)) {
      userInfoMap.set(id, userCache.value.get(id)!)
    }
  })

  if (uncachedUserIds.length === 0) {
    return userInfoMap
  }

  try {
    const response = await request.post(`${USER_SERVER_URL}/user/batch`, uncachedUserIds)

    if (response.data.code === 200 && response.data.data) {
      const userProfiles = response.data.data

      userProfiles.forEach((userInfo: any) => {
        const info = {
          nickname: userInfo.nickname || `UP主_${userInfo.userId}`
        }
        
        userCache.value.set(userInfo.userId, info)
        userInfoMap.set(userInfo.userId, info)
      })
    }
  } catch (error) {
    console.error('批量获取用户信息失败:', error)
  }

  return userInfoMap
}

// 格式化时长
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `0:${seconds.toString().padStart(2, '0')}`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 格式化播放量
const formatPlayCount = (count: number): string => {
  if (count < 1000) return count.toString()
  if (count < 10000) return (count / 1000).toFixed(1) + 'k'
  if (count < 100000000) return (count / 10000).toFixed(1) + '万'
  return (count / 100000000).toFixed(1) + '亿'
}

// 加载相关推荐
const loadRecommendations = async () => {
  loading.value = true
  try {
    const getRecommendedVideoDTO = {
      videoId: props.videoId,
      limit: 10 // 推荐10个视频
    }

    const response = await request.post(`${VIDEO_SERVER_URL}/video/recommendations`, getRecommendedVideoDTO)

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '获取推荐视频失败')
    }

    const videos: VideoData[] = response.data.data || []
    
    if (videos.length === 0) {
      recommendations.value = []
      return
    }

    // 提取所有用户ID
    const userIds = Array.from(new Set(videos.map(video => video.userId)))
    
    // 批量获取用户信息
    const userInfoMap = await getBatchUserInfo(userIds)

    // 组装推荐视频数据
    recommendations.value = videos.map((video: VideoData) => {
      const userInfo = userInfoMap.get(video.userId) || { nickname: `UP主_${video.userId}` }
      
      return {
        id: video.id,
        title: video.title,
        coverUrl: video.coverUrl ? 
          `${BASE_MINIO_URL}/cover/${video.coverUrl}` : '',
        duration: video.duration,
        uploaderName: userInfo.nickname,
        playCount: Math.floor(Math.random() * 100000), // 模拟播放量
        createAt: video.createAt
      } as RecommendationVideo
    })

  } catch (error) {
    console.error('加载推荐视频失败:', error)
    ElMessage.error('加载推荐视频失败')
    recommendations.value = []
  } finally {
    loading.value = false
  }
}

// 视频点击处理
const handleVideoClick = (video: RecommendationVideo) => {
  // 跳转到视频页面，参考 IndexPage 中 VideoCard 的点击事件
  console.log("跳转视频" + `/index/video/${video.id}`)
  router.push(`/index/video/${video.id}`)
}

// 初始化
onMounted(() => {
  loadRecommendations()
})

// 暴露刷新方法给父组件
defineExpose({
  refreshRecommendations: loadRecommendations
})
</script>

<style scoped>
.video-recommendations {
  padding: 16px;
}

.recommendations-header {
  margin-bottom: 20px;
}

.recommendations-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

/* 推荐列表 */
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  /* 添加点击效果 */
  user-select: none;
}

.recommendation-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recommendation-item:active {
  transform: translateY(0);
}

/* 视频封面 */
.video-cover {
  position: relative;
  width: 140px;
  height: 79px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  /* 添加过渡效果 */
  transition: transform 0.3s ease;
}

.recommendation-item:hover .video-cover {
  transform: scale(1.05);
}

.cover-image {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.image-placeholder,
.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-placeholder);
}

.duration-tag {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

/* 视频信息 */
.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
  padding: 4px 0;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  margin: 0 0 12px 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
  /* 添加悬停效果 */
  transition: color 0.3s ease;
}

.recommendation-item:hover .video-title {
  color: var(--el-color-primary);
}

.uploader-info {
  margin-bottom: 8px;
}

.uploader-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.2;
  transition: color 0.3s ease;
}

.recommendation-item:hover .uploader-name {
  color: var(--el-text-color-primary);
}

.video-meta {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.2;
}

.play-count {
  display: inline-block;
}

/* 空状态和加载状态 */
.empty-recommendations,
.loading-recommendations {
  padding: 40px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-cover {
    width: 120px;
    height: 68px;
  }
  
  .video-title {
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .recommendation-item {
    gap: 8px;
    padding: 8px;
  }
  
  .recommendations-list {
    gap: 12px;
  }
  
  /* 移动端减少悬停效果 */
  .recommendation-item:hover {
    transform: none;
    box-shadow: none;
  }
  
  .recommendation-item:hover .video-cover {
    transform: none;
  }
}

/* 加载动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recommendation-item {
  animation: fadeIn 0.3s ease-out;
}
</style>