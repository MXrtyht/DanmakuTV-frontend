<template>
  <div class="video-page">
    <el-row :gutter="20">
      <!-- 主要内容区域 -->
      <el-col :span="18">
        <!-- 视频播放器区域 -->
        <el-card
          class="video-card"
          shadow="never"
        >
          <div class="video-player">
            <!-- 视频播放器 -->
            <video
              v-if="videoStreamUrl"
              ref="videoPlayer"
              :src="videoStreamUrl"
              controls
              preload="metadata"
              class="video-element"
              @loadstart="onVideoLoadStart"
              @canplay="onVideoCanPlay"
              @error="onVideoError"
            >
              您的浏览器不支持视频播放
            </video>

            <!-- 加载状态 -->
            <div
              v-else-if="loading"
              class="video-loading"
            >
              <el-icon
                class="is-loading"
                size="48"
              >
                <Loading />
              </el-icon>
              <p>视频加载中...</p>
            </div>

            <!-- 错误状态 -->
            <div
              v-else-if="error"
              class="video-error"
            >
              <el-icon size="48">
                <VideoPlay />
              </el-icon>
              <p>视频加载失败</p>
              <el-button @click="loadVideoInfo">重新加载</el-button>
            </div>

            <!-- 默认占位 -->
            <div
              v-else
              class="video-placeholder"
            >
              <el-icon size="48">
                <VideoPlay />
              </el-icon>
              <p>视频播放器</p>
              <p>视频ID: {{ videoId }}</p>
            </div>
          </div>
        </el-card>

        <!-- 视频信息区域 -->
        <el-card
          class="video-info-card"
          shadow="never"
        >
          <div class="video-title">
            <h2>{{ videoData.title || '视频标题加载中...' }}</h2>
          </div>

          <div class="video-stats">
            <div class="stats-info">
              <span>时长: {{ formatDuration(videoData.duration) }}</span>
              <el-divider direction="vertical" />
              <span>分区: {{ getAreaName(videoData.area) }}</span>
              <el-divider direction="vertical" />
              <span>{{ formatDate(videoData.createAt) }}</span>
            </div>
          </div>

          <!-- 新增：视频操作菜单栏 -->
          <div class="video-actions">
            <el-button
              class="action-btn"
              size="large"
              @click="handleLike"
            >
              <el-icon><Star /></el-icon>
              <span>点赞</span>
              <span class="count">1.2k</span>
            </el-button>

            <el-button
              class="action-btn"
              size="large"
              @click="handleCoin"
            >
              <el-icon><Coin /></el-icon>
              <span>投币</span>
              <span class="count">89</span>
            </el-button>

            <el-button
              class="action-btn"
              size="large"
              @click="handleFavorite"
            >
              <el-icon><Collection /></el-icon>
              <span>收藏</span>
              <span class="count">456</span>
            </el-button>
          </div>

          <!-- 视频标签 -->
          <div
            v-if="videoData.tags && videoData.tags.length > 0"
            class="video-tags"
          >
            <span class="tags-label">标签：</span>
            <el-tag
              v-for="tag in videoData.tags"
              :key="tag.id"
              class="tag-item"
              size="small"
            >
              {{ tag.name }}
            </el-tag>
          </div>

          <!-- 视频描述 -->
          <div class="video-description">
            <el-collapse>
              <el-collapse-item
                title="视频信息"
                name="1"
              >
                <div class="description-content">
                  <p><strong>UP主ID：</strong>{{ videoData.userId }}</p>
                  <p><strong>类型：</strong>{{ videoData.type ? '转载' : '自制' }}</p>
                  <p><strong>发布时间：</strong>{{ formatDate(videoData.createAt) }}</p>
                  <p><strong>更新时间：</strong>{{ formatDate(videoData.updateAt) }}</p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-col>

      <!-- 侧边栏占位 -->
      <el-col :span="6">
        <el-card
          class="sidebar-card"
          shadow="never"
        >
          <div class="sidebar-placeholder">
            <el-empty description="相关推荐" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay, Loading, Star, Coin, Collection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import type { VideoData } from '@/types/entity/video'

const route = useRoute()
const videoId = route.params.videoId

// 环境变量
// const MINIO_SERVER_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API
const MINIO_SERVICE_URL = import.meta.env.VITE_MINIO_SERVICE_BASE_API
const VIDEO_SERVER_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API

// 响应式数据
const loading = ref(true)
const error = ref(false)
const videoData = ref<VideoData>({
  id: 0,
  userId: '',
  videoUrl: '',
  coverUrl: '',
  title: '',
  type: false,
  duration: 0,
  area: 0,
  tags: [
    { id: 1, name: 'Vue3' },
    { id: 2, name: 'TypeScript' },
    { id: 3, name: '前端开发' },
    { id: 4, name: '教程' },
    { id: 5, name: '编程' }
  ],
  createAt: '',
  updateAt: ''
})

const videoStreamUrl = ref('')
const videoPlayer = ref<HTMLVideoElement>()

// 互动
const handleLike = () => {
  console.log('点赞')
  ElMessage.success('点赞成功')
}

const handleCoin = () => {
  console.log('投币')
  ElMessage.success('投币成功')
}

const handleFavorite = () => {
  console.log('收藏')
  ElMessage.success('收藏成功')
}

// 视频分区映射
const areaMap: Record<number, string> = {
  1: '动画',
  2: '音乐',
  3: '游戏',
  4: '科技',
  5: '生活',
  6: '娱乐',
  7: '时尚',
  8: '体育',
  9: '影视'
}

// 格式化时长 (秒转换为 mm:ss)
const formatDuration = (seconds: number): string => {
  if (!seconds) return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取分区名称
const getAreaName = (areaId: number): string => {
  return areaMap[areaId] || '未知分区'
}

// 构建视频流URL
const buildVideoStreamUrl = (videoUrl: string): string => {
  // 使用您提供的分片视频流接口
  const bucketName = 'video' // 假设视频存储在 video 桶中
  return `${MINIO_SERVICE_URL}/upload/video-slice/${bucketName}/${videoUrl}`
}

// 加载视频信息
const loadVideoInfo = async () => {
  try {
    loading.value = true
    error.value = false
    
    console.log('加载视频信息:', videoId)
    
    // 调用后端接口获取视频信息
    const response = await request.get(`${VIDEO_SERVER_URL}/video/id`, {
      params: {
        videoId: videoId
      }
    })

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '获取视频信息失败')
    }

    const data = response.data.data as VideoData
    videoData.value = data

    console.log(data)

    // 构建视频流URL
    if (data.videoUrl) {
      videoStreamUrl.value = buildVideoStreamUrl(data.videoUrl)
      console.log('视频流URL:', videoStreamUrl.value)
    }
    
  } catch (err) {
    console.error('加载视频信息失败:', err)
    error.value = true
    ElMessage.error('加载视频信息失败')
  } finally {
    loading.value = false
  }
}

// 视频播放器事件处理
const onVideoLoadStart = () => {
  console.log('视频开始加载')
}

const onVideoCanPlay = () => {
  console.log('视频可以播放')
}

const onVideoError = (event: Event) => {
  console.error('视频播放错误:', event)
  ElMessage.error('视频播放失败，请检查网络连接')
}

// 初始化
onMounted(() => {
  loadVideoInfo()
})
</script>

<style scoped>
.video-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 视频播放器 */
.video-card {
  margin-bottom: 16px;
}

.video-player {
  width: 100%;
  height: 400px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-placeholder,
.video-loading,
.video-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  background: #f5f5f5;
}

.video-loading .el-icon {
  margin-bottom: 16px;
}

.video-error .el-button {
  margin-top: 16px;
}

/* 视频信息 */
.video-info-card {
  margin-bottom: 16px;
}

.video-title h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  line-height: 1.4;
}

.video-stats {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.stats-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/* 视频标签 */
.video-tags {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.tags-label {
  font-weight: 500;
  margin-right: 8px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 4px;
}

/* 视频描述 */
.description-content p {
  margin: 8px 0;
  color: var(--el-text-color-regular);
}

/* 侧边栏 */
.sidebar-card {
  position: sticky;
  top: 20px;
}

.sidebar-placeholder {
  padding: 40px 0;
}

/* 视频操作菜单栏 */
.video-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  border-radius: 8px;
  transition: all 0.3s;
}

.action-btn:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.action-btn .el-icon {
  font-size: 18px;
}

.action-btn .count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-left: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-page {
    padding: 10px;
  }

  .video-player {
    height: 250px;
  }

  .video-title h2 {
    font-size: 16px;
  }
}
</style>