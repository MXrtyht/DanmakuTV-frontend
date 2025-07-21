<!-- 展示视频的基本信息, 以及点赞,收藏,投币操作 -->
<template>
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

    <!-- 视频操作菜单栏 -->
    <div class="video-actions">
      <el-button
        class="action-btn"
        :class="{ 'liked': likeData.isLiked }"
        size="large"
        :loading="likeLoading"
        @click="handleLike"
      >
        <el-icon>
          <Star :class="{ 'liked-icon': likeData.isLiked }" />
        </el-icon>
        <span>{{ likeData.isLiked ? '已点赞' : '点赞' }}</span>
        <span class="count">{{ likeData.likeCount }}</span>
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
        :class="{ 'collected': collectData.isCollected }"
        size="large"
        @click="handleFavorite"
      >
        <el-icon>
          <Collection :class="{ 'collected-icon': collectData.isCollected }" />
        </el-icon>
        <span>{{ collectData.isCollected ? '已收藏' : '收藏' }}</span>
        <span class="count">{{ formatCount(collectData.collectCount) }}</span>
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
        :key="tag"
        class="tag-item"
        size="small"
      >
        {{ tag }}
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
</template>

<script setup lang="ts">
import { Star, Coin, Collection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { VideoData } from '@/types/entity/video'

interface Props {
  videoData: VideoData
  likeData: {
    isLiked: boolean
    likeCount: number
  }
  collectData: {
    isCollected: boolean
    collectCount: number
  }
  likeLoading: boolean
}

interface Emits {
  (e: 'like'): void
  (e: 'coin'): void
  (e: 'favorite'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

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

// 格式化数量显示
const formatCount = (count: number): string => {
  if (count < 1000) return count.toString()
  if (count < 10000) return (count / 1000).toFixed(1) + 'k'
  if (count < 100000000) return (count / 10000).toFixed(1) + '万'
  return (count / 100000000).toFixed(1) + '亿'
}

// 交互事件处理
const handleLike = () => {
  emit('like')
}

const handleCoin = () => {
  console.log('投币')
  ElMessage.success('投币成功')
  emit('coin')
}

const handleFavorite = () => {
  emit('favorite')
}
</script>

<style scoped>
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

/* 已点赞状态 */
.action-btn.liked {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.liked-icon {
  color: var(--el-color-primary);
}

/* 已收藏状态 */
.action-btn.collected {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.collected-icon {
  color: var(--el-color-warning);
}

.action-btn .el-icon {
  font-size: 18px;
}

.action-btn .count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-left: 4px;
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
</style>
