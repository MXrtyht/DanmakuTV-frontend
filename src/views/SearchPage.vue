<template>
  <HeaderBar :sticky="false" :show-search="false"/>
  <div class="search-results-page">
    <!-- 顶部搜索框 -->
    <div class="search-section">
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索视频、UP主"
          class="search-input"
          clearable
          size="large"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button
              @click="handleSearch"
              :icon="Search"
              type="primary"
            />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 搜索结果内容 -->
    <div v-else-if="searchResults" class="results-container">
      <!-- 中层：匹配度最高的用户 -->
      <div v-if="searchResults.topUser" class="user-section">
        <div class="section-title">
          <h2>相关用户</h2>
        </div>

        <div class="user-card">
          <!-- 用户信息部分 -->
          <div class="user-info">
            <el-avatar
              :src="searchResults.topUser.avatar"
              :size="60"
              class="user-avatar"
            >
            <!-- TODO 设置为用户的头像 -->
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="user-details">
              <div class="user-header">
                <el-button
                  type="primary"
                  size="small"
                  class="follow-btn"
                  @click="handleFollowUser(searchResults.topUser.id)"
                >
                  关注
                </el-button>
                <h3 class="user-name">{{ searchResults.topUser.name }}</h3>
              </div>
              <p class="user-stats">
                <span>{{ formatNumber(searchResults.topUser.followers) }} 粉丝</span>
                <span class="separator">·</span>
                <span>{{ formatNumber(searchResults.topUser.videoCount) }} 作品</span>
              </p>
              <p v-if="searchResults.topUser.description" class="user-description">
                {{ searchResults.topUser.description }}
              </p>
            </div>
          </div>

          <!-- 用户视频部分 -->
          <div v-if="searchResults.topUser.videos && searchResults.topUser.videos.length > 0" class="user-videos">
            <h4 class="videos-title">TA的视频</h4>
            <div class="videos-row">
              <VideoCard
                v-for="videoItem in userVideoCards"
                :key="videoItem.video.id"
                :video="videoItem.video"
                :uploader-name="videoItem.uploaderName"
                :uploader-avatar="videoItem.uploaderAvatar"
                :play-count="videoItem.playCount"
                class="user-video-card"
                @click="handleVideoClick"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 下层：匹配到的视频网格 -->
      <div v-if="searchResults.videos && searchResults.videos.length > 0">
        <div class="section-title">
          <h2>相关视频</h2>
          <span class="result-count">共找到 {{ searchResults.totalCount }} 个结果</span>
        </div>

        <div class="videos-grid">
          <VideoCard
            v-for="videoItem in searchVideoCards"
            :key="videoItem.video.id"
            :video="videoItem.video"
            :uploader-name="videoItem.uploaderName"
            :uploader-avatar="videoItem.uploaderAvatar"
            :play-count="videoItem.playCount"
            class="grid-video-card"
            @click="handleVideoClick"
          />
        </div>

      <!-- 无结果提示 -->
      <div v-if="!searchResults.topUser && (!searchResults.videos || searchResults.videos.length === 0)" class="no-results">
        <el-empty description="暂无搜索结果">
          <el-button type="primary" @click="clearSearch">重新搜索</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 初始状态 -->
    <div v-else class="initial-state">
      <el-empty description="输入关键词开始搜索" />
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import VideoCard from '@/components/videoCard/VideoCard.vue'
import HeaderBar from '@/components/headerBar/HeaderBar.vue'
import type { VideoVO, VideoCardInfo } from '@/types/entity/video'
import axios from 'axios'
import request from '@/utils/request'

// 数据类型定义
interface UserInfo {
  id: string
  name: string
  avatar: string
  followers: number
  videoCount: number
  description?: string
  videos?: VideoVO[]
}

interface SearchResults {
  topUser?: UserInfo
  videos: VideoVO[]
  totalCount: number
}

// 响应式数据
const searchKeyword = ref('')
const searchResults = ref<SearchResults | null>(null)
const loading = ref(false)
const currentPage = ref(1)

// 计算属性：将用户视频转换为VideoCard需要的格式
const userVideoCards = computed((): VideoCardInfo[] => {
  if (!searchResults.value?.topUser?.videos) return []

  return searchResults.value.topUser.videos.slice(0, 4).map(video => ({
    video,
    uploaderName: searchResults.value!.topUser!.name,
    uploaderAvatar: searchResults.value!.topUser!.avatar,
    playCount: Math.floor(Math.random() * 50000) + 1000 // 硬编码播放量
  }))
})

// 计算属性：将搜索结果视频转换为VideoCard需要的格式
const searchVideoCards = computed((): VideoCardInfo[] => {
  if (!searchResults.value?.videos) return []

  return searchResults.value.videos.map(video => ({
    video,
    uploaderName: `UP主${video.id}`,
    uploaderAvatar: `https://via.placeholder.com/32x32/409EFF/ffffff?text=U${video.id}`,
    playCount: Math.floor(Math.random() * 50000) + 1000 // 硬编码播放量
  }))
})

// 方法
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  loading.value = true
  currentPage.value = 1

  try {
    // 调用搜索API
    searchResults.value = mockSearchResults
    // const response = await request.get('')
    // if(response.data.code !== 200) {
    //   console.log('搜索失败:', response.data.message)
    //   ElMessage.error('搜索失败，请稍后再试')
    //   return
    // }
  } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
          console.error('注册失败:', error.response.data.message);
      } else if (error instanceof Error) {
          console.error('请求失败:', error.message);
      } else {
          console.error('请求失败: 未知错误');
      }
  } finally {
    loading.value = false
  }
}

const handleFollowUser = async (userId: string) => {
  try {
    // 调用关注用户API
    const response = await request.post(`/user/follow/${userId}`)
    if (response.data.code !== 200) {
      console.error('关注失败:', response.data.message)
      ElMessage.error('关注失败，请稍后再试')
      return
    }
    ElMessage.success('关注成功')
  } catch (error:unknown) {
      if (axios.isAxiosError(error) && error.response) {
          console.error('注册失败:', error.response.data.message);
      } else if (error instanceof Error) {
          console.error('请求失败:', error.message);
      } else {
          console.error('请求失败: 未知错误');
      }
  }
}

const handleVideoClick = (video: VideoVO) => {
  console.log('点击视频:', video)
  // 这里可以跳转到视频播放页面
}

const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = null
}

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 模拟数据（转换为VideoData格式）
const mockSearchResults = {
  topUser: {
    id: '1',
    name: '科技UP主小明',
    avatar: 'https://via.placeholder.com/60x60/409EFF/ffffff?text=用户',
    followers: 125000,
    videoCount: 89,
    description: '专注前端开发技术分享，每周更新Vue、React等前端框架教程',
    videos: [
      {
        id: 1,
        userId: 1,
        videoUrl: 'https://example.com/video1.mp4',
        coverUrl: 'https://via.placeholder.com/300x180/67C23A/ffffff?text=视频1',
        title: 'Vue3 + TypeScript 项目实战教程',
        type: true,
        duration: 1520,
        area: 1,
        tags: ['Vue3', 'TypeScript'],
        createAt: '2024-01-15T10:30:00',
        updateAt: '2024-01-15T10:30:00'
      },
      {
        id: 2,
        userId: 1,
        videoUrl: 'https://example.com/video2.mp4',
        coverUrl: 'https://via.placeholder.com/300x180/E6A23C/ffffff?text=视频2',
        title: 'ElementUI组件库深度解析',
        type: true,
        duration: 2340,
        area: 1,
        tags: ['ElementUI', 'Vue'],
        createAt: '2024-01-12T14:20:00',
        updateAt: '2024-01-12T14:20:00'
      },
      {
        id: 3,
        userId: 1,
        videoUrl: 'https://example.com/video3.mp4',
        coverUrl: 'https://via.placeholder.com/300x180/F56C6C/ffffff?text=视频3',
        title: '前端性能优化实践指南',
        type: true,
        duration: 1890,
        area: 1,
        tags: ['性能优化', '前端'],
        createAt: '2024-01-10T09:15:00',
        updateAt: '2024-01-10T09:15:00'
      }
    ]
  },
  videos: [
    {
      id: 4,
      userId: 2,
      videoUrl: 'https://example.com/video4.mp4',
      coverUrl: 'https://via.placeholder.com/300x180/909399/ffffff?text=React',
      title: 'React Hooks 完全指南',
      type: true,
      duration: 1680,
      area: 1,
      tags: ['React', 'Hooks'],
      createAt: '2024-01-14T16:45:00',
      updateAt: '2024-01-14T16:45:00'
    },
    {
      id: 5,
      userId: 3,
      videoUrl: 'https://example.com/video5.mp4',
      coverUrl: 'https://via.placeholder.com/300x180/E6A23C/ffffff?text=JS',
      title: 'JavaScript 异步编程详解',
      type: true,
      duration: 2100,
      area: 1,
      tags: ['JavaScript', '异步编程'],
      createAt: '2024-01-13T11:30:00',
      updateAt: '2024-01-13T11:30:00'
    },
    {
      id: 6,
      userId: 4,
      videoUrl: 'https://example.com/video6.mp4',
      coverUrl: 'https://via.placeholder.com/300x180/F56C6C/ffffff?text=CSS',
      title: 'CSS Grid 布局实战',
      type: true,
      duration: 1440,
      area: 1,
      tags: ['CSS', 'Grid'],
      createAt: '2024-01-11T13:20:00',
      updateAt: '2024-01-11T13:20:00'
    },
    {
      id: 7,
      userId: 5,
      videoUrl: 'https://example.com/video7.mp4',
      coverUrl: 'https://via.placeholder.com/300x180/67C23A/ffffff?text=Node',
      title: 'Node.js 后端开发入门',
      type: true,
      duration: 2580,
      area: 1,
      tags: ['Node.js', '后端'],
      createAt: '2024-01-09T15:10:00',
      updateAt: '2024-01-09T15:10:00'
    },
    {
      id: 8,
      userId: 6,
      videoUrl: 'https://example.com/video8.mp4',
      coverUrl: 'https://via.placeholder.com/300x180/409EFF/ffffff?text=TS',
      title: 'TypeScript 类型系统深入',
      type: true,
      duration: 1920,
      area: 1,
      tags: ['TypeScript'],
      createAt: '2024-01-08T10:00:00',
      updateAt: '2024-01-08T10:00:00'
    },
    {
      id: 9,
      userId: 7,
      videoUrl: 'https://example.com/video9.mp4',
      coverUrl: 'https://via.placeholder.com/300x180/909399/ffffff?text=WP',
      title: 'Webpack 5 配置优化指南',
      type: true,
      duration: 1760,
      area: 1,
      tags: ['Webpack'],
      createAt: '2024-01-07T14:30:00',
      updateAt: '2024-01-07T14:30:00'
    }
  ],
  totalCount: 156
}

// 组件挂载时自动加载示例数据
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const keyword = urlParams.get('q')
  if (keyword) {
    searchKeyword.value = keyword
    handleSearch()
  } else {
    // 如果没有搜索参数，加载默认示例数据
    searchKeyword.value = ''
    handleSearch()
  }
})
</script>

<style scoped>
.search-results-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 40px;
}

.search-section {
  background: white;
  padding: 30px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.loading-container {
  width: 100%;
  max-width: none;
  margin: 40px 0;
  padding: 0 20px;
}

.results-container {
  width: 100%;
  max-width: none;
  margin: 0;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 20px 0;
}

.section-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-title .result-count {
  color: #909399;
  font-size: 14px;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.follow-btn {
  border-radius: 20px;
  padding: 4px 16px;
  font-size: 13px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.user-stats {
  color: #909399;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.user-stats .separator {
  margin: 0 8px;
}

.user-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.videos-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.videos-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.user-video-card {
  max-width: 100%;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.grid-video-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.no-results,
.initial-state {
  text-align: center;
  padding: 80px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section {
    padding: 20px 0;
  }

  .results-container {
    padding: 0 15px;
  }

  .section-title {
    margin: 30px 0 15px 0;
  }

  .section-title h2 {
    font-size: 18px;
  }

  .user-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-header {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .videos-row,
  .videos-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .search-container {
    padding: 0 15px;
  }

  .user-card {
    padding: 16px;
  }

  .videos-row,
  .videos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
