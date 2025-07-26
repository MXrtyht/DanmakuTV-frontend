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

      <!-- 投币按钮 -->
      <el-button
        class="action-btn"
        :class="{ 'coined': coinData.isCoined }"
        size="large"
        :loading="coinLoading"
        :disabled="coinData.isCoined"
        @click="showCoinDialog"
      >
        <el-icon>
          <Coin :class="{ 'coined-icon': coinData.isCoined }" />
        </el-icon>
        <span>{{ coinData.isCoined ? '已投币' : '投币' }}</span>
        <span class="count">{{ coinData.coinCount }}</span>
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

        <!-- 投币对话框 -->
    <el-dialog
      v-model="coinDialogVisible"
      title="选择投币数量"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="coin-dialog-content">
        <p class="coin-tip">为这个视频投币吧！投币后不可撤回哦~</p>
        
        <div class="coin-options">
          <div 
            class="coin-option"
            :class="{ 'selected': selectedCoinAmount === 1 }"
            @click="selectedCoinAmount = 1"
          >
            <div class="coin-icon">
              <el-icon size="32"><Coin /></el-icon>
            </div>
            <div class="coin-text">投1个币</div>
          </div>
          
          <div 
            class="coin-option"
            :class="{ 'selected': selectedCoinAmount === 2 }"
            @click="selectedCoinAmount = 2"
          >
            <div class="coin-icon">
              <el-icon size="32"><Coin /></el-icon>
              <el-icon size="32"><Coin /></el-icon>
            </div>
            <div class="coin-text">投2个币</div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="coinDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            :disabled="!selectedCoinAmount"
            @click="confirmCoin"
          >
            确认投币
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  coinData: {
    isCoined: boolean
    coinCount: number
  }
  likeLoading: boolean
  coinLoading: boolean
}

interface Emits {
  (e: 'like'): void
  (e: 'coin', coinAmount: number): void
  (e: 'favorite'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 投币对话框相关
const coinDialogVisible = ref(false)
const selectedCoinAmount = ref(0)

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

// 显示投币对话框
const showCoinDialog = () => {
  selectedCoinAmount.value = 0
  coinDialogVisible.value = true
}

// 确认投币
const confirmCoin = () => {
  if (selectedCoinAmount.value > 0) {
    emit('coin', selectedCoinAmount.value)
    coinDialogVisible.value = false
  }
}

// 交互事件处理
const handleLike = () => {
  emit('like')
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

/* 已投币状态 */
.action-btn.coined {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.coined-icon {
  color: var(--el-color-warning);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn:disabled:hover {
  border-color: var(--el-border-color);
  background: var(--el-fill-color-blank);
}

/* 投币对话框样式 */
.coin-dialog-content {
  text-align: center;
}

.coin-tip {
  margin-bottom: 24px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.coin-options {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.coin-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border: 2px solid var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--el-fill-color-blank);
}

.coin-option:hover {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.coin-option.selected {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning-light-8);
  box-shadow: 0 0 0 2px var(--el-color-warning-light-7);
}

.coin-icon {
  display: flex;
  gap: 4px;
  color: var(--el-color-warning);
}

.coin-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.coin-option.selected .coin-text {
  color: var(--el-color-warning);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
