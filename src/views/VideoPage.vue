<template>
  <div class="video-page">
    <el-row :gutter="20">
      <!-- 主要内容区域 -->
      <el-col :span="18">
        <!-- 视频播放器区域 -->
        <!-- 使用 VideoPlayer 组件 -->
        <VideoPlayer
          :video-stream-url="videoStreamUrl"
          :loading="loading"
          :error="error"
          :video-id=videoId
          @retry="loadVideoInfo"
        />

        <!-- 视频信息区域 -->
        <VideoInfoActions
          :video-data="videoData"
          :like-data="likeData"
          :collect-data="collectData"
          :like-loading="likeLoading"
          @like="handleLike"
          @coin="handleCoin"
          @favorite="handleFavorite"
        />

        <!-- 评论区域 -->
        <VideoComments :video-id="videoId" />
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

    <!-- 收藏分组选择弹窗 -->
    <el-dialog
      v-model="collectDialogVisible"
      title="选择收藏分组"
      width="450px"
      :before-close="cancelCollect"
    >
      <div class="collect-dialog-content">
        <div class="group-selection">
          <div
            v-for="group in collectionGroups"
            :key="group.id"
            class="group-item"
            :class="{ 'selected': selectedGroupId === group.id }"
            @click="selectedGroupId = group.id"
          >
            <el-radio
              :model-value="selectedGroupId"
              :value="group.id"
              class="group-radio"
              @change="selectedGroupId = group.id"
            >
              <div class="group-content">
                <span class="group-name">{{ group.name }}</span>
                <span
                  v-if="group.userId === null"
                  class="default-tag"
                >默认</span>
              </div>
            </el-radio>
          </div>
        </div>

        <div
          class="empty-state"
          v-if="collectionGroups.length === 0"
        >
          <el-empty description="暂无收藏分组，请先创建分组" />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelCollect">取消</el-button>
          <el-button
            type="primary"
            :loading="collectLoading"
            :disabled="!selectedGroupId || collectionGroups.length === 0"
            @click="confirmCollect"
          >
            确认收藏
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { VideoData } from '@/types/entity/video'
import type { CollectionGroup } from '@/types/entity/videoCollect'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import VideoPlayer from '../components/VideoPageComponents/VideoPlayer.vue'
import VideoInfoActions from '../components/VideoPageComponents/VideoInfoActions.vue'
import VideoComments from '../components/VideoPageComponents/VideoComments.vue'


const route = useRoute()
const videoId = Number(route.params.videoId)

// 环境变量
// const MINIO_SERVER_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API
const INTERACTION_SERVICE_URL = import.meta.env.VITE_INTERACTION_SERVICE_BASE_API;
const MINIO_SERVICE_URL = import.meta.env.VITE_MINIO_SERVICE_BASE_API
const VIDEO_SERVER_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API

// 响应式数据
const loading = ref(true)
const error = ref(false)
const videoData = ref<VideoData>({
  id: 0,
  userId: 0,
  videoUrl: '',
  coverUrl: '',
  title: '',
  type: false,
  duration: 0,
  area: 0,
  tags: [],
  createAt: '',
  updateAt: ''
})

const videoStreamUrl = ref('')

//点赞相关状态
const likeData = ref({
  isLiked: false,
  likeCount: 0
})
const likeLoading = ref(false)

// 收藏相关状态
const collectDialogVisible = ref(false)
const collectionGroups = ref<CollectionGroup[]>([])
const selectedGroupId = ref<number | null>(null)
const collectLoading = ref(false)
const currentCollectedGroupId = ref<number | null>(null)

// 收藏数据状态
const collectData = ref({
  isCollected: false,
  collectCount: 0
})

// 加载点赞信息
const loadLikeInfo = async () => {
  try {
    const response = await request.get(`${INTERACTION_SERVICE_URL}/video/like`, {
      params: {
        videoId: videoId
      }
    })

    if (response.data.code === 200) {
      const data = response.data.data
      likeData.value = {
        isLiked: data.isLiked || false,
        likeCount: data.likeCount || 0
      }
    }
  } catch (error) {
    console.error('获取点赞信息失败:', error)
    // 失败时使用默认值
    likeData.value = {
      isLiked: false,
      likeCount: 0
    }
  }
}

// 互动
const handleLike = async () => {
  if (likeLoading.value) return // 防止重复点击

  try {
    likeLoading.value = true

    if (likeData.value.isLiked) {
      // 取消点赞
      const response = await request.delete(`${INTERACTION_SERVICE_URL}/video/like`, {
        params: {
          videoId: videoId
        }
      })

      if (response.data.code === 200) {
        likeData.value.isLiked = false
        likeData.value.likeCount = Math.max(0, likeData.value.likeCount - 1)
        ElMessage.success('已取消点赞')
      } else {
        throw new Error(response.data.message || '取消点赞失败')
      }
    } else {
      // 点赞
      const response = await request.post(`${INTERACTION_SERVICE_URL}/video/like`, null, {
        params: {
          videoId: videoId
        }
      })

      if (response.data.code === 200) {
        likeData.value.isLiked = true
        likeData.value.likeCount += 1
        ElMessage.success('点赞成功')
      } else {
        throw new Error(response.data.message || '点赞失败')
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    likeLoading.value = false
  }
}

// 获取收藏分组列表
const loadCollectionGroups = async () => {
  try {
    const response = await request.get(`${INTERACTION_SERVICE_URL}/video/collection-groups`)

    if (response.data.code === 200) {
      collectionGroups.value = response.data.data || []
      // 默认选中第一个分组（通常是默认分组）
      if (collectionGroups.value.length > 0) {
        selectedGroupId.value = collectionGroups.value[0].id
      }
    } else {
      throw new Error(response.data.message || '获取收藏分组失败')
    }
  } catch (error) {
    console.error('获取收藏分组失败:', error)
    ElMessage.error('获取收藏分组失败')
  }
}

const handleCoin = () => {
  console.log('投币')
  ElMessage.success('投币成功')
}

const handleFavorite = async () => {
  // 打开收藏分组选择弹窗
  collectDialogVisible.value = true

  // 加载收藏分组列表
  await loadCollectionGroups()

  // 如果已收藏，预选当前分组
  if (collectData.value.isCollected && currentCollectedGroupId.value) {
    selectedGroupId.value = currentCollectedGroupId.value
  } else if (collectionGroups.value.length > 0) {
    // 未收藏时默认选中第一个分组
    selectedGroupId.value = collectionGroups.value[0].id
  }
}

// 确认收藏
const confirmCollect = async () => {
  if (!selectedGroupId.value) {
    ElMessage.warning('请选择收藏分组')
    return
  }

  try {
    collectLoading.value = true

    const addVideoCollectionDTO = {
      userId: 0, // 后端会自动替换为当前用户ID
      videoId: Number(videoId),
      groupId: selectedGroupId.value,
      collectedAt: new Date()
    }

    const response = await request.post(`${INTERACTION_SERVICE_URL}/video/add-collection`, addVideoCollectionDTO)

    if (response.data.code === 200) {
      const wasCollected = collectData.value.isCollected

      ElMessage.success('收藏成功')
      collectDialogVisible.value = false

      // 更新收藏状态
      collectData.value.isCollected = true
      currentCollectedGroupId.value = selectedGroupId.value

      // 如果之前未收藏，收藏数量+1
      if (!wasCollected) {
        collectData.value.collectCount += 1
      }

    } else {
      throw new Error(response.data.message || '收藏失败')
    }

  } catch (error) {
    console.error('收藏失败:', error)
    ElMessage.error('收藏失败，请重试')
  } finally {
    collectLoading.value = false
  }
}

// 取消收藏弹窗
const cancelCollect = () => {
  collectDialogVisible.value = false
  selectedGroupId.value = null
}

// 构建视频流URL
const buildVideoStreamUrl = (videoUrl: string): string => {
  // 使用您提供的分片视频流接口
  const bucketName = 'video' // 假设视频存储在 video 桶中
  return `${MINIO_SERVICE_URL}/upload/video-slice/${bucketName}/${videoUrl}`
}

// 加载收藏信息
const loadCollectInfo = async () => {
  try {
    // 获取收藏数量
    const countResponse = await request.get(`${INTERACTION_SERVICE_URL}/video/video-collect-count`, {
      params: {
        videoId: videoId
      }
    })

    if (countResponse.data.code === 200) {
      collectData.value.collectCount = countResponse.data.data || 0
    }

    // 使用新接口检查是否已收藏
    const isCollectedResponse = await request.get(`${INTERACTION_SERVICE_URL}/video/is-video-collected`, {
      params: {
        videoId: videoId
      }
    })

    if (isCollectedResponse.data.code === 200) {
      const groupId = isCollectedResponse.data.data

      if (groupId !== null) {
        // 已收藏，记录收藏状态和分组ID
        collectData.value.isCollected = true
        currentCollectedGroupId.value = groupId
      } else {
        // 未收藏
        collectData.value.isCollected = false
        currentCollectedGroupId.value = null
      }
    }

  } catch (error) {
    console.error('获取收藏信息失败:', error)
    // 失败时使用默认值
    collectData.value = {
      isCollected: false,
      collectCount: 0
    }
    currentCollectedGroupId.value = null
  }
}

// 加载视频信息
const loadVideoInfo = async () => {
  try {
    loading.value = true
    error.value = false

    console.log('加载视频信息:', videoId)
    // 添加视频记录
    const hisResponse = await request.post(`${VIDEO_SERVER_URL}/video/video-views`,videoId,{
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (hisResponse.data.code !== 200) {
      ElMessage.error('添加历史记录失败:', hisResponse.data.data)
    }

    // 并行加载点赞信息和收藏信息
    const [,] = await Promise.all([
      loadLikeInfo(),
      loadCollectInfo() // 加载收藏信息
    ])

    // 调用后端接口获取视频信息
    const response = await request.get(`${VIDEO_SERVER_URL}/video/id`, {
      params: {
        videoId: videoId
      }
    })

    if (response.data.code !== 200) {
      console.error('获取视频信息失败:', response.data.data)
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

/* 侧边栏 */
.sidebar-card {
  position: sticky;
  top: 20px;
}

.sidebar-placeholder {
  padding: 40px 0;
}

.collect-dialog-content {
  padding: 10px 0;
  max-height: 400px;
  overflow-y: auto;
}

.group-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  cursor: pointer;
  transition: all 0.3s;
  background: var(--el-fill-color-blank);
}

.group-item:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.group-item.selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.group-radio {
  width: 100%;
  margin: 0;
}

.group-radio .el-radio__input {
  margin-right: 12px;
}

.group-radio .el-radio__label {
  width: 100%;
  padding: 0;
}

.group-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.group-name {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.default-tag {
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--el-color-primary-light-7);
  font-weight: normal;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 选中状态的单选框样式 */
.group-item.selected .el-radio__input.is-checked .el-radio__inner {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.group-item.selected .el-radio__input.is-checked+.el-radio__label {
  color: var(--el-text-color-primary);
}

/* 弹窗整体样式调整 */
.el-dialog__header {
  padding: 20px 20px 10px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.el-dialog__body {
  padding: 20px;
}

.el-dialog__footer {
  padding: 15px 20px 20px 20px;
}

/* 滚动条样式 */
.collect-dialog-content::-webkit-scrollbar {
  width: 6px;
}

.collect-dialog-content::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.collect-dialog-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color-dark);
  border-radius: 3px;
}

.collect-dialog-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-placeholder);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-dialog {
    width: 90% !important;
    margin: 0 5%;
  }

  .group-item {
    padding: 16px 12px;
  }

  .group-name {
    font-size: 16px;
  }

  .collect-dialog-content {
    max-height: 300px;
  }
}

/* 点击动画效果 */
.group-item:active {
  transform: scale(0.98);
}
</style>
