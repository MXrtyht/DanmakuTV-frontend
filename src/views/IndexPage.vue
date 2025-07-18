<template>
  <div class="index-page">
    <el-container>
      <el-main class="main-content">
        <!-- 视频列表 -->
        <div
          v-infinite-scroll="loadMore"
          :infinite-scroll-disabled="loading || noMore"
          infinite-scroll-distance="100"
          class="video-list"
        >
          <el-row :gutter="16">
            <el-col
              v-for="video in videoList"
              :key="video.id"
              :xs="24"
              :sm="24"
              :md="12"
              :lg="12"
              :xl="12"
              class="video-item"
            >
              <VideoCard
                :video="video"
                :uploader-name="video.uploaderName"
                :uploader-avatar="video.uploaderAvatar"
                :play-count="video.playCount"
                @click="goToVideo(video.id)"
              />
            </el-col>
          </el-row>

          <!-- 加载状态 -->
          <div
            v-if="loading"
            class="loading-container"
          >
            <el-skeleton
              :rows="2"
              animated
            />
          </div>

          <!-- 没有更多数据 -->
          <div
            v-if="noMore && videoList.length > 0"
            class="no-more"
          >
            <el-divider>已经到底了~</el-divider>
          </div>

          <!-- 空状态 -->
          <div
            v-if="!loading && videoList.length === 0"
            class="empty-state"
          >
            <el-empty description="暂无视频内容" />
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import VideoCard from '@/components/videoCard/VideoCard.vue'
import { da } from 'element-plus/es/locales.mjs'

interface VideoTag {
  id: number
  name: string
}

interface VideoVO {
  id: number
  userId: string
  videoUrl: string
  coverUrl: string
  title: string
  type: boolean
  duration: number
  area: number
  tags: VideoTag[]
  createAt: string
  updateAt: string
  // 扩展字段
  uploaderName?: string
  uploaderAvatar?: string
  playCount?: number
}

interface UserProfilesVO {
  userId: number
  nickname: string
  gender: string
  birthday: string
  sign: string
  announcement: string
  avatar: string
  coin: number
}

const BASE_SERVER_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API
const MINIO_SERVER_BASE = import.meta.env.VITE_MINIO_SERVER_BASE_API

// 数据状态
const videoList = ref<VideoVO[]>([])
const loading = ref(false)
const noMore = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// 用户信息缓存
const userCache = ref<Map<string, UserProfilesVO>>(new Map())

// 获取单个用户信息
const getUserInfo = async (userId: string): Promise<UserProfilesVO | null> => {
  // 先检查缓存
  if (userCache.value.has(userId)) {
    return userCache.value.get(userId)!
  }

  try {
    // 这里需要根据实际的获取单个用户信息的接口来修改
    // 假设有一个根据 userId 获取用户信息的接口
    const response = await request.get(`${USER_SERVER_URL}/user/profile/${userId}`)
    
    if (response.data.code === 200 && response.data.data) {
      const userInfo = response.data.data
      // 处理头像URL
      if (userInfo.avatar) {
        userInfo.avatar = `${MINIO_SERVER_BASE}/avatar/${userInfo.avatar}`
      }
      
      // 缓存用户信息
      userCache.value.set(userId, userInfo)
      return userInfo
    }
  } catch (error) {
    console.error(`获取用户 ${userId} 信息失败:`, error)
  }
  
  return null
}



// 加载视频列表
const loadVideos = async (page: number = 1, isLoadMore: boolean = false) => {
  if (loading.value) return

  loading.value = true

  try {
    const response = await request.get(`${BASE_SERVER_URL}/video/all`, {
      params: {
        page,
        size: pageSize.value
      }
    })

    const data = response.data

    if (data.code !== 200) {
      ElMessage.error(data.message || '获取视频列表失败')
      return
    }

    const pageData = data.data
    const records = pageData.records || []

    console.log('data:')
    console.log(records)
    console.log( `${MINIO_SERVER_BASE}/cover/${records[1].coverUrl}`)

    // 处理视频数据，添加一些模拟的扩展信息
    const processedVideos = records.map((video: VideoVO) => ({
      ...video,
      // 拼接完整的封面URL：MINIO_SERVER_BASE + /cover/ + ObjectName
      coverUrl: video.coverUrl
        ? `${MINIO_SERVER_BASE}/cover/${video.coverUrl}`
        : '', // 如果没有封面则为空字符串
      uploaderName: `UP主_${video.userId}`, // 这里应该从用户信息接口获取
      uploaderAvatar: '', // 这里应该从用户信息接口获取
      playCount: Math.floor(Math.random() * 100000) // 模拟播放量，实际应该从接口获取
    }))

    if (isLoadMore) {
      videoList.value.push(...processedVideos)
    } else {
      videoList.value = processedVideos
    }

    // 检查是否还有更多数据
    noMore.value = pageData.current >= pageData.pages || records.length === 0

  } catch (error) {
    console.error('获取视频列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (noMore.value || loading.value) return

  currentPage.value++
  loadVideos(currentPage.value, true)
}

// 跳转到视频详情页
const goToVideo = (videoId: number) => {
  // TODO: 实现跳转到视频详情页
  console.log('跳转到视频:', videoId)
  // router.push(`/video/${videoId}`)
}

// 初始化
onMounted(() => {
  loadVideos(1)
})
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

.main-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.video-list {
  min-height: 400px;
}

.video-item {
  margin-bottom: 16px;
}

.loading-container {
  padding: 20px;
  text-align: center;
}

.no-more {
  text-align: center;
  margin: 20px 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }

  .video-item {
    margin-bottom: 12px;
  }
}
</style>