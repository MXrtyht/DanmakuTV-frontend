<template>
  <HeaderBar
    :sticky="false"
    :show-search="false"
  />
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
    <div
      v-if="loading"
      class="loading-container"
    >
      <el-skeleton
        :rows="5"
        animated
      />
    </div>

    <!-- 搜索结果内容 -->
    <div
      v-else-if="searchResults"
      class="results-container"
    >
      <!-- 中层：匹配度最高的用户 -->
      <div
        v-if="searchResults.topUser"
        class="user-section"
      >
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
              <el-icon v-if="!searchResults.topUser.avatar">
                <User />
              </el-icon>
            </el-avatar>
            <div class="user-details">
              <div class="user-header">
                <el-button
                  :type="searchResults.topUser.isFollowed ? 'info' : 'primary'"
                  size="small"
                  class="follow-btn"
                  :class="{ 'followed': searchResults.topUser.isFollowed }"
                  @click="handleFollowUser(searchResults.topUser.id)"
                  @mouseenter="handleFollowBtnHover(true)"
                  @mouseleave="handleFollowBtnHover(false)"
                >
                  {{ getFollowButtonText(searchResults.topUser.isFollowed) }}
                </el-button>
                <h3 class="user-name">{{ searchResults.topUser.name }}</h3>
              </div>
              <p class="user-stats">
                <span>{{ formatNumber(searchResults.topUser.followers) }} 粉丝</span>
                <!-- TODO 没有获取视频数的接口-->
                <!-- <span class="separator">·</span>
                <span>{{ formatNumber(searchResults.topUser.videoCount) }} 作品</span> -->
              </p>
              <p
                v-if="searchResults.topUser.description"
                class="user-description"
              >
                {{ searchResults.topUser.description }}
              </p>
            </div>
          </div>

          <!-- 用户视频部分 -->
          <div
            v-if="searchResults.topUser.videos && searchResults.topUser.videos.length > 0"
            class="user-videos"
          >
            <h4 class="videos-title">TA的视频</h4>
            <div class="videos-row">
              <VideoCard
                v-for="videoItem in searchResults.topUser!.videos"
                :key="videoItem.id"
                :video="videoItem"
                :uploader-name="videoItem.uploaderName"
                :uploader-avatar="videoItem.uploaderAvatar"
                :play-count="videoItem.playCount"
                class="user-video-card"
                @click="handleVideoClick(videoItem.id)"
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
        <!-- 视频网格（保持原有样式） -->
        <div class="videos-grid">
          <VideoCard
            v-for="videoItem in searchResults.videos"
            :key="videoItem.id"
            :video="videoItem"
            :uploader-name="videoItem.uploaderName"
            :uploader-avatar="videoItem.uploaderAvatar"
            :play-count="videoItem.playCount"
            class="grid-video-card"
            @click="handleVideoClick(videoItem.id)"
          />
        </div>
        <!-- 分页控件 -->
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="searchResults.totalCount"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          class="search-pagination"
        />

        <!-- 无结果提示 -->
        <div
          v-if="
            !searchResults.topUser && (!searchResults.videos || searchResults.videos.length === 0)
          "
          class="no-results"
        >
          <el-empty description="暂无搜索结果">
            <el-button
              type="primary"
              @click="clearSearch"
            >重新搜索</el-button>
          </el-empty>
        </div>
      </div>

      <!-- 初始状态 -->
      <div
        v-else
        class="initial-state"
      >
        <el-empty description="输入关键词开始搜索" />
      </div>
    </div>
  </div>

  <!-- 关注分组选择器 -->
  <FollowGroupSelector
    v-model="showFollowDialog"
    title="选择关注分组"
    @confirm="handleFollowConfirm"
    @cancel="handleFollowCancel"
  />
</template>

<script setup lang="ts">
import FollowGroupSelector from '@/components/FollowGroupSelector/FollowGroupSelector.vue'
import HeaderBar from '@/components/headerBar/HeaderBar.vue'
import VideoCard from '@/components/videoCard/VideoCard.vue'
import type { IPage } from '@/types/api/iPage'
import type { UserProfile } from '@/types/entity/user'
import type { VideoData, VideoVO } from '@/types/entity/video'
import type { GenreResponse } from '@/types/response/genreResponse'
import request from '@/utils/request'
import { getVideoPlayCountBatch } from '@/utils/utils'
import { Search, User } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { onMounted, ref,watch } from 'vue'
import { useRouter,useRoute  } from 'vue-router'

const BASE_VEDIO_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API
const BASE_USER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const BASE_SEARCH_URL = import.meta.env.VITE_SEARCH_SERVICE_BASE_API
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API

const router = useRouter()
const route = useRoute()

// 新增类型定义
interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

interface VideoES {
  id: number
  userId: number
  videoUrl: string
  coverUrl: string
  title: string
  description: string
  type: boolean
  duration: number
  area: boolean
  createAt: string
  updateAt: string
}

interface UserProfilesES {
  id: number
  userId: number
  nickname: string
  gender: boolean
  birthday: string
  sign: string
  announcement: string
  avatar: string
  coin: number
  createAt: string
  updateAt: string
}

// 数据类型定义
interface UserSearchInfo {
  id: number
  name: string
  avatar: string
  followers?: number
  // videoCount?: number
  description?: string
  videos?: VideoVO[]
  isFollowed?: boolean // 添加关注状态
}

interface SearchResults {
  topUser?: UserSearchInfo
  videos: VideoVO[]
  totalCount: number
}

// 响应式数据
const searchKeyword = ref('')
const searchResults = ref<SearchResults>({ videos: [], totalCount: 0 })
const loading = ref(false)
const showFollowDialog = ref(false)
const currentFollowUserId = ref<number | null>(null)
const isHoveringFollowBtn = ref(false)

const pagination = ref({
  size: 10,
  page: 1,
})

// 方法
// 进行搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  if (route.query.q !== searchKeyword.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchKeyword.value.trim() }
    });
  }

  loading.value = true

  try {
    // 1. 调用接口搜索用户信息
    const userSearchResult = await getSearchUserInfo()
    if (userSearchResult !== undefined) {
      searchResults.value.topUser = userSearchResult as UserSearchInfo
      console.log(searchResults.value.topUser)
    }

    // 2. 调用搜索视频接口
    const videoSearchResult = await getSearchVideoInfo()
    if (videoSearchResult !== undefined) {
      searchResults.value.videos = videoSearchResult.result as VideoData[]
      // 3. 更新SearchResults的总数
      searchResults.value.totalCount = videoSearchResult.total
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('请求失败:', error.response.data.message)
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
    } else {
      console.error('请求失败: 未知错误')
    }
  } finally {
    loading.value = false
  }
}

// 修正后的搜索用户方法
const getSearchUserInfo = async () => {
  let userInfo: UserSearchInfo | undefined = undefined

  const userRes = await request.get<GenreResponse<Page<UserProfilesES>>>(
    `${BASE_SEARCH_URL}/search/user-page`,
    {
      params: {
        nickname: searchKeyword.value,
        page: pagination.value.page - 1,
        size: pagination.value.size,
      },
    },
  )

  if (userRes.data.code !== 200 || !userRes.data.data) {
    console.error('搜索用户失败:', userRes.data.message)
    ElMessage.error(userRes.data.message || '搜索用户失败')
    return userInfo
  }

  // 使用ES返回的Page结构
  const userPageData = userRes.data.data as Page<UserProfilesES>

  if (userPageData.content.length > 0) {
    const topUser = userPageData.content[0]
    userInfo = {
      id: topUser.userId, // ES中使用userId
      name: topUser.nickname,
      avatar: `${BASE_MINIO_URL}/avatar/${topUser.avatar}`,
      description: topUser.sign,
    }

    // 获取用户粉丝数
    try {
      const userFollowCount = await request.get(`${BASE_USER_URL}/user/fans-count-by-id`, {
        params: {
          userId: topUser.userId
        }
      })

      if (userFollowCount.data.code === 200) {
        userInfo.followers = userFollowCount.data.data as number
      }
    } catch (error) {
      console.error('获取用户粉丝数失败:', error)
      userInfo.followers = 0
    }

    // 检查是否已关注该用户
    try {
      const followStatusRes = await request.get(`${BASE_USER_URL}/user/is-following`, {
        params: {
          followId: topUser.userId
        }
      })

      if (followStatusRes.data.code === 200) {
        userInfo.isFollowed = followStatusRes.data.data as boolean
      }
    } catch (error) {
      console.error('检查关注状态失败:', error)
      userInfo.isFollowed = false
    }

    // 使用正确的接口获取用户视频
    try {
      const userVideoRes = await request.get<GenreResponse<IPage<VideoData>>>(
        `${BASE_VEDIO_URL}/video/user-videos-by-id`,
        {
          params: {
            userId: topUser.userId,
            page: 0,
            size: 4,
          },
        },
      )

      if (userVideoRes.data.code === 200 && userVideoRes.data.data) {
        const pageData = userVideoRes.data.data as IPage<VideoData>
        userInfo.videos = pageData.records.map((video) => ({
          ...video,
          uploaderAvatar: topUser.avatar,
          uploaderName: topUser.nickname,
        }))

        // 获取播放量
        const videoIdList: number[] = pageData.records.map((video) => video.id)
        if(videoIdList.length>0){
          const videoCountRes = await getVideoPlayCountBatch(
            videoIdList,
            `${BASE_VEDIO_URL}/video/video-view-counts-batch`,
          )

          if (videoCountRes !== undefined) {
            userInfo.videos.forEach((video) => {
              video.playCount = videoCountRes.get(video.id) || 0
            })
          }
        }
      }
    } catch (error) {
      console.error('获取用户视频失败:', error)
      userInfo.videos = []
    }
  }

  return userInfo
}

// 修正后的搜索视频方法
const getSearchVideoInfo = async () => {
  let videoInfo: VideoVO[] | undefined = undefined
  let total: number = 0

  const videoRes = await request.get<GenreResponse<Page<VideoES>>>(
    `${BASE_SEARCH_URL}/search/video-page`,
    {
      params: {
        keyword: searchKeyword.value,
        page: pagination.value.page - 1,
        size: pagination.value.size,
      },
    },
  )

  if (videoRes.data.code !== 200 || !videoRes.data.data) {
    console.error('搜索视频失败:', videoRes.data.message)
    ElMessage.error(videoRes.data.message || '搜索视频失败')
    return { result: videoInfo, total: total }
  }

  // 使用ES返回的Page结构
  const pageData = videoRes.data.data as Page<VideoES>

  if (pageData.content.length > 0) {
    // 将ES数据转换为VideoData格式
    videoInfo = pageData.content.map(esVideo => ({
      id: esVideo.id,
      userId: esVideo.userId,
      videoUrl: esVideo.videoUrl,
      coverUrl: esVideo.coverUrl,
      title: esVideo.title,
      description: esVideo.description,
      type: esVideo.type,
      duration: esVideo.duration,
      area: esVideo.area ? 1 : 0,
      createAt: esVideo.createAt,
      updateAt: esVideo.updateAt,
    })) as VideoData[]

    total = pageData.totalElements

    // 获取用户信息
    const userIdList: number[] = pageData.content.map((video) => video.userId)

    try {
      const userInfoRes = await request.post(`${BASE_USER_URL}/user/batch`, userIdList)

      if (userInfoRes.data.code === 200 && userInfoRes.data.data) {
        const userInfo = userInfoRes.data.data as UserProfile[]
        const userMap = new Map<number, UserProfile>()
        userInfo.forEach((user) => {
          userMap.set(user.userId, user)
        })

        videoInfo = videoInfo.map((video) => {
          const uploader = userMap.get(video.userId)
          return {
            ...video,
            uploaderName: uploader?.nickname,
            uploaderAvatar: uploader?.avatar,
          }
        })
      }
    } catch (error) {
      console.error('批量获取用户信息失败:', error)
    }

    // 获取播放量
    const videoIdList: number[] = pageData.content.map((video) => video.id)
    try {
      const videoCountRes = await getVideoPlayCountBatch(
        videoIdList,
        `${BASE_VEDIO_URL}/video/video-view-counts-batch`,
      )

      if (videoCountRes !== undefined) {
        videoInfo.forEach((video) => {
          video.playCount = videoCountRes.get(video.id) || 0
        })
      }
    } catch (error) {
      console.error('获取视频播放量失败:', error)
    }
  } else {
    return { result: videoInfo, total: total }
  }

  return { result: videoInfo, total: total }
}

// 修正后的关注用户方法
const handleFollowUser = async (userId: number) => {
  const user = searchResults.value.topUser
  if (!user) return

  if (user.isFollowed) {
    // 已关注，执行取关操作
    await handleUnfollowUser(userId)
  } else {
    // 未关注，显示关注分组选择器
    currentFollowUserId.value = userId
    showFollowDialog.value = true
  }
}

// 处理关注确认
const handleFollowConfirm = async (groupId: number) => {
  if (!currentFollowUserId.value) {
    ElMessage.error('用户信息错误')
    return
  }

  try {
    // 使用正确的DTO格式
    const followDTO = {
      followId: currentFollowUserId.value,
      groupId: groupId
    }

    const response = await request.post(`${BASE_USER_URL}/user/follow`, followDTO)

    if (response.data.code !== 200) {
      console.error('关注失败:', response.data.message)
      ElMessage.error(response.data.message || '关注失败，请稍后再试')
      return
    }
    ElMessage.success('关注成功')

    // 更新用户关注状态
    if (searchResults.value.topUser && searchResults.value.topUser.id === currentFollowUserId.value) {
      searchResults.value.topUser.isFollowed = true
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('关注失败:', error.response.data.message)
      ElMessage.error(error.response.data.message || '关注失败')
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
      ElMessage.error('关注失败，请稍后再试')
    } else {
      console.error('请求失败: 未知错误')
      ElMessage.error('关注失败，请稍后再试')
    }
  } finally {
    currentFollowUserId.value = null
  }
}

// 处理取关操作
const handleUnfollowUser = async (userId: number) => {
  try {
    const unfollowDTO = {
      userId: 0, // 当前用户ID，通常由后端从token获取
      followId: userId,
      groupId: 1 // 默认分组，实际应该获取用户所在的分组
    }

    const response = await request.post(`${BASE_USER_URL}/user/unfollow`, unfollowDTO)

    if (response.data.code !== 200) {
      console.error('取关失败:', response.data.message)
      ElMessage.error(response.data.message || '取关失败，请稍后再试')
      return
    }

    ElMessage.success('取消关注成功')

    // 更新用户关注状态
    if (searchResults.value.topUser && searchResults.value.topUser.id === userId) {
      searchResults.value.topUser.isFollowed = false
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('取关失败:', error.response.data.message)
      ElMessage.error(error.response.data.message || '取关失败')
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
      ElMessage.error('取关失败，请稍后再试')
    } else {
      console.error('请求失败: 未知错误')
      ElMessage.error('取关失败，请稍后再试')
    }
  }
}

// 处理关注取消
const handleFollowCancel = () => {
  currentFollowUserId.value = null
}

// 处理关注按钮悬停
const handleFollowBtnHover = (isHovering: boolean) => {
  isHoveringFollowBtn.value = isHovering
}

// 获取关注按钮文本
const getFollowButtonText = (isFollowed: boolean | undefined) => {
  if (!isFollowed) {
    return '关注'
  }
  return isHoveringFollowBtn.value ? '取消关注' : '已关注'
}

// 视频跳转
const handleVideoClick = (videoId: number) => {
  router.push(`/index/video/${videoId}`)
}

// 清空搜索输入框
const clearSearch = () => {
  searchKeyword.value = ''
  // searchResults.value = null
}

// 格式化日期
const formatNumber = (num: number | undefined): string => {
  if (num === undefined) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 每页条数变化
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  // loadVideos()
}

// 翻页处理
const handlePageChange = async () => {
  // 仅仅处理视频

  loading.value = true

  try {
    // 1. 调用搜索视频接口
    const videoSearchResult = await getSearchVideoInfo()
    if (videoSearchResult !== undefined) {
      searchResults.value.videos = videoSearchResult.result as VideoData[]
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('翻页失败:', error.response.data.message)
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
    } else {
      console.error('请求失败: 未知错误')
    }
  } finally {
    loading.value = false
  }
}

// 组件挂载时自动加载示例数据
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const keyword = urlParams.get('q')
  // 如果有搜索参数，直接使用
  if (keyword) {
    searchKeyword.value = keyword
    handleSearch()
  }
})

watch(
  () => route.query.q, // 监听 query.q 的变化
  (newKeyword) => {
    if (newKeyword) {
      searchKeyword.value = newKeyword.toString();
      handleSearch(); // 执行搜索逻辑
    }
  },
  { immediate: true } // 首次加载也触发
);
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  transition: all 0.3s ease;
}

.follow-btn.followed {
  background-color: #f5f7fa;
  border-color: #d3d3d3;
  color: #909399;
}

.follow-btn.followed:hover {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
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

.search-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .search-pagination {
    flex-wrap: wrap;
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
