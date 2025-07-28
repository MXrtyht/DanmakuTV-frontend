<template>
  <el-container class="main-container">
    <!-- 左侧分组栏 -->
    <GroupSidebar
      :group-list="groupList"
      :active-group-index="activeGroupIndex"
      placeholder="输入收藏分组名称"
      @add-group="addGroup"
      @remove-group="removeGroup"
      @select-group="selectGroup"
    />

    <!-- 右侧视频列表 -->
    <el-main class="right-content">
      <div
        v-if="videoList === null || videoList === undefined || videoList.length === 0"
        class="empty-state"
      >
        <el-empty description="当前分组暂无收藏视频" />
      </div>
      <el-row
        v-else
        :gutter="16"
      >
        <el-col
          v-for="video in videoList"
          :key="video.video.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <VideoCard
            :video="video.video"
            :uploader-name="video.uploaderName"
            :uploader-avatar="video.uploaderAvatar"
            :play-count="video.playCount"
            @click="handleVideoClick"
          />
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import VideoCard from '@/components/videoCard/VideoCard.vue'
import GroupSidebar from '@/components/GroupSidebar/GroupSidebar.vue'
import type { UserProfile } from '@/types/entity/user'
import type { VideoCardInfo, VideoData } from '@/types/entity/video'
import type { CollectionGroup, VideoCollect } from '@/types/entity/videoCollect'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const INTERACTION_SERVICE_URL = import.meta.env.VITE_INTERACTION_SERVICE_BASE_API
// const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API
const VIDEO_SERVER_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API
const USER_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API

const groupList = ref<CollectionGroup[]>([])
const activeGroupIndex = ref<number | null>(null)

// 视频相关数据
const videoList = ref<VideoCardInfo[]>([])

// 处理视频点击事件
const handleVideoClick = (video: VideoData) => {
  router.push(`/index/video/${video.id}`)
}

// 加载收藏分组列表
const loadGroups = async () => {
  try {
    const response = await request.get(`${INTERACTION_SERVICE_URL}/video/collection-groups`)
    const data = response.data

    if (data.code !== 200) {
      ElMessage.error('获取收藏分组失败')
      return
    }

    groupList.value = data.data || []
    console.log(groupList.value)

    // 默认选中第一个分组
    if (groupList.value.length > 0) {
      activeGroupIndex.value = 0
      await loadVideosByGroup(groupList.value[0].id)
    }

  } catch (error) {
    console.error('获取收藏分组失败:', error)
    ElMessage.error('获取收藏分组失败')
  }
}

// 根据分组ID加载视频
const loadVideosByGroup = async (groupId: number) => {
  try {
    const response = await request.get(`${INTERACTION_SERVICE_URL}/video/collections-by-group`, {
      params: { groupId }
    })

    if (response.data.code !== 200) {
      console.error('获取收藏视频失败:', response.data.message)
      videoList.value = []
      return
    }

    const collections: VideoCollect[] = response.data.data || []

    if (collections.length === 0) {
      videoList.value = []
      return
    }

    // 提取所有视频ID
    const videoIds = collections.map((collection: VideoCollect) => collection.videoId)
    console.log('视频ID列表:', videoIds)

    // 批量获取视频信息
    const videoInfoMap = await getBatchVideoInfo(videoIds)
    console.log('视频信息映射:', videoInfoMap)

    // 提取需要获取用户信息的用户ID
    const userIds = Array.from(new Set(
      Array.from(videoInfoMap.values()).map(video => video.userId)
    ))

    // 批量获取用户信息
    const userInfoMap = await getBatchUserInfo(userIds)
    console.log('用户信息映射:', userInfoMap)

    // 组装最终的视频数据
    videoList.value = collections.map((collection: VideoCollect) => {
      const videoInfo = videoInfoMap.get(collection.videoId)
      const userInfo = userInfoMap.get(videoInfo?.userId || 0)

      if (!videoInfo) {
        // 如果视频信息获取失败，返回默认数据
        return {
          video: {
            id: collection.videoId,
            title: '视频不存在或已删除',
            videoUrl: '',
            coverUrl: '',
            duration: 0,
            createAt: '',
            updateAt: '',
            description:'',
            userId: 0,
            type: false,
            area: 0,
            tags: []
          },
          uploaderName: '未知用户',
          uploaderAvatar: '',
          playCount: 0
        } as VideoCardInfo
      }

      return {
        video: {
          ...videoInfo,
          // 不用拼接了, 传入objectName, videoCard会拼接
          coverUrl: videoInfo.coverUrl ?
            `${videoInfo.coverUrl}` : ''
        },
        uploaderName: userInfo?.nickname || `UP主_${videoInfo.userId}`,
        uploaderAvatar: userInfo?.avatar ?
          `${userInfo.avatar}` : '',
        playCount: Math.floor(Math.random() * 100000) // 模拟播放量
      } as VideoCardInfo
    }).filter(item => item.video.title !== '视频不存在或已删除') // 过滤掉无效视频

  } catch (error) {
    console.error('获取收藏视频失败:', error)
    videoList.value = []
  }
}

// 批量获取用户信息
const getBatchUserInfo = async (userIds: number[]): Promise<Map<number, UserProfile>> => {
  const userInfoMap = new Map<number, UserProfile>()

  if (userIds.length === 0) {
    return userInfoMap
  }

  try {
    // 调用批量获取用户信息接口
    const response = await request.post(`${USER_SERVER_URL}/user/batch`, userIds)

    if (response.data.code === 200 && response.data.data) {
      const userProfiles: UserProfile[] = response.data.data

      // 处理返回的用户信息
      userProfiles.forEach((userInfo: UserProfile) => {
        userInfoMap.set(userInfo.userId, userInfo)
      })
    }
  } catch (error) {
    console.error('批量获取用户信息失败:', error)
  }

  return userInfoMap
}

// 批量获取视频信息
const getBatchVideoInfo = async (videoIds: number[]): Promise<Map<number, VideoData>> => {
  const videoInfoMap = new Map<number, VideoData>()

  if (videoIds.length === 0) {
    return videoInfoMap
  }

  try {
    // 调用批量获取视频信息接口
    const response = await request.post(`${VIDEO_SERVER_URL}/video/batch`, videoIds)

    if (response.data.code === 200 && response.data.data) {
      const videos = response.data.data

      // 处理返回的视频信息
      videos.forEach((video: VideoData) => {
        videoInfoMap.set(video.id, video)
      })
    }
  } catch (error) {
    console.error('批量获取视频信息失败:', error)
  }

  return videoInfoMap
}

// 选择分组
const selectGroup = async (index: number) => {
  activeGroupIndex.value = index
  const selectedGroup = groupList.value[index]
  if (selectedGroup) {
    await loadVideosByGroup(selectedGroup.id)
  }
}



// 添加收藏分组
const addGroup = async (groupName: string) => {
  try {
    const response = await request.post(`${INTERACTION_SERVICE_URL}/video/add-collection-group`, groupName, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '创建收藏分组失败')
      return
    }

    ElMessage.success('收藏分组创建成功')
    // 注意：不再需要清空 newGroupName，因为组件内部会处理

    // 重新加载分组列表
    await loadGroups()

  } catch (error) {
    console.error('创建收藏分组失败:', error)
    ElMessage.error('创建收藏分组失败')
  }
}

// 删除收藏分组
const removeGroup = async (index: number) => {
  try {
    const groupToDelete = groupList.value[index]
    if (!groupToDelete || groupToDelete.id === 1) {
      ElMessage.error('无法删除默认分组')
      return
    }

    const response = await request.post(`${INTERACTION_SERVICE_URL}/video/delete-collection-group`, groupToDelete.id, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '删除收藏分组失败')
      return
    }

    ElMessage.success('删除收藏分组成功')

    // 重新加载数据
    await loadGroups()

  } catch (error) {
    console.error('删除收藏分组失败:', error)
    ElMessage.error('删除收藏分组失败')
  }
}

onMounted(() => {
  loadGroups()
})
</script>

<style scoped>
.main-container {
  height: 100vh;
  background-color: #f5f5f5;
}

.right-content {
  padding: 20px;
  background-color: #fff;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
}
</style>
