<template>
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
        <el-button @click="handleRetry">重新加载</el-button>
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
        <p v-if="videoId">视频ID: {{ videoId }}</p>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { VideoPlay, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

interface Props {
  videoStreamUrl?: string
  loading?: boolean
  error?: boolean
  videoId?: number
}

interface Emits {
  (e: 'loadstart'): void
  (e: 'canplay'): void
  (e: 'error', event: Event): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
  videoStreamUrl: '',
  loading: false,
  error: false,
  videoId: 0
})

const emit = defineEmits<Emits>()

const videoPlayer = ref<HTMLVideoElement>()

// 视频播放器事件处理
const onVideoLoadStart = () => {
  console.log('视频开始加载')
  emit('loadstart')
}

const onVideoCanPlay = () => {
  console.log('视频可以播放')
  emit('canplay')
}

const onVideoError = (event: Event) => {
  console.error('视频播放错误:', event)
  ElMessage.error('视频播放失败，请检查网络连接')
  emit('error', event)
}

const handleRetry = () => {
  emit('retry')
}

// 暴露视频播放器实例，供父组件调用
defineExpose({
  videoPlayer
})
</script>

<style scoped>
.video-card {
  margin-bottom: 16px;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
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
</style>