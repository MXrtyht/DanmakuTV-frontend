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
import VideoCard from '@/components/videoCard/VideoCard.vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type {VideoVO} from '@/types/entity/video'
import type { UserInfo } from '@/types/entity/user'

const BASE_SERVER_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API
const USER_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const MINIO_SERVER_BASE = import.meta.env.VITE_MINIO_SERVER_BASE_API

const router = useRouter()

// 数据状态
const videoList = ref<VideoVO[]>([])
const loading = ref(false)
const noMore = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// 用户信息缓存
const userCache = ref<Map<string, UserInfo>>(new Map())

// 批量获取用户信息
const getBatchUserInfo = async (userIds: string[]): Promise<Map<string, UserInfo>> => {
  const userInfoMap = new Map<string, UserInfo>()

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
    // 转换为数字类型的用户ID列表
    const numericUserIds = uncachedUserIds.map(id => parseInt(id))

    // 调用批量获取用户信息接口
    const response = await request.post(`${USER_SERVER_URL}/user/batch`, numericUserIds)

    if (response.data.code === 200 && response.data.data) {
      const userProfiles = response.data.data

      // 处理返回的用户信息
      userProfiles.forEach((userInfo: UserInfo) => {
        // 处理头像URL
        if (userInfo.avatar) {
          userInfo.avatar = `${MINIO_SERVER_BASE}/avatar/${userInfo.avatar}`
        }

        // 缓存用户信息
        const userIdString = userInfo.userId.toString()
        userCache.value.set(userIdString, userInfo)
        userInfoMap.set(userIdString, userInfo)
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

    console.log('视频数据:')
    console.log(records)

    // 直接提取用户ID列表，不去重（后端会处理重复ID）
    const userIds: string[] = records.map((video: VideoVO) => video.userId)
    console.log('用户ID列表:', userIds)

    // 批量获取用户信息
    const userInfoMap = await getBatchUserInfo(userIds)
    console.log('用户信息映射:', userInfoMap)

    // 处理视频数据
    const processedVideos = records.map((video: VideoVO) => {
      const userInfo = userInfoMap.get(video.userId)

      return {
        ...video,
        // 拼接完整的封面URL
        coverUrl: video.coverUrl
          ? `${MINIO_SERVER_BASE}/cover/${video.coverUrl}`
          : '',
        // 使用真实的用户信息
        uploaderName: userInfo?.nickname || `UP主_${video.userId}`,
        uploaderAvatar: userInfo?.avatar || '',
        playCount: Math.floor(Math.random() * 100000) // 模拟播放量，实际应该从接口获取
      }
    })

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
  router.push(`/index/video/${videoId}`)
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
