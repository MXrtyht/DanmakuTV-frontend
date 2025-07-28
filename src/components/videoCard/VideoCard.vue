<template>
  <el-card class="video-card" shadow="hover" @click="handleCardClick">
    <div class="card-content">
      <!-- 左侧1/3：视频封面 -->
      <div class="cover-container">
        <el-image
          :src="`${BASE_MINIO_URL}/cover/${video.coverUrl}`"
          class="video-cover"
          fit="cover"
          :alt="video.title"
        />
        <!-- 视频时长 -->
        <div class="duration">{{ formatDuration(video.duration) }}</div>
      </div>

      <!-- 右侧2/3：视频信息 -->
      <div class="video-info">
        <!-- 视频标题 -->
        <h3 class="video-title">{{ video.title }}</h3>

        <!-- UP主信息 -->
        <div class="uploader-info">
          <el-avatar
            :src="`${BASE_MINIO_URL}/avatar/${uploaderAvatar}`"
            :size="32"
            class="uploader-avatar"
          />
          <span class="uploader-name">{{ uploaderName }}</span>
        </div>

        <!-- 播放量 -->
        <div class="play-count">
          <el-icon><VideoPlay /></el-icon>
          {{ formatPlayCount(playCount) }}
        </div>

        <!-- 发布时间 -->
        <div class="publish-time">{{ formatTime(video.createAt) }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { VideoPlay } from '@element-plus/icons-vue'
import type { VideoData,VideoCardInfo } from '@/types/entity/video'

const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API

// 导出属性
const props = withDefaults(defineProps<VideoCardInfo>(), {
  uploaderName: '未知UP主',
  uploaderAvatar: '',
  playCount: 0
})

// 定义 emits
const emit = defineEmits<{
  click: [video: VideoData]
}>()

// 格式化视频时长 (秒 -> HH:mm:ss)
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}

// 格式化播放量
const formatPlayCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

// 格式化时间
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 处理卡片点击
const handleCardClick = () => {
  emit('click', props.video)
}
</script>

<style scoped>
.video-card {
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 16px;
}

.video-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  gap: 12px;
}

/* 左侧封面容器 */
.cover-container {
  position: relative;
  width: 33%;
  flex-shrink: 0;
}

.video-cover {
  width: 100%;
  height: 120px;
  border-radius: 6px;
}

.duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* 右侧视频信息 */
.video-info {
  width: 67%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #303133;
  line-clamp: 2;
  display: box;
  display: -webkit-box;
}

.uploader-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.uploader-name {
  font-size: 14px;
  color: #606266;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.publish-time {
  font-size: 12px;
  color: #C0C4CC;
  margin-top: auto;
}
</style>
