<template>
  <div class="user-grid">
    <!-- 空状态提示 -->
    <div v-if="videoList.length === 0" class="empty-state">
      <el-empty description="暂无视频" />
    </div>

    <!-- 视频列表 -->
    <el-row v-else :gutter="16" class="grid-container">
      <el-col
        v-for="video in videoList"
        :key="video.video.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        class="grid-item"
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
  </div>
</template>

<script setup lang="ts">
import VideoCard from '@/components/videoCard/VideoCard.vue'
import request from '@/utils/request';
import { ref, onMounted } from 'vue'

const BASE_VEDIO_URL =import.meta.env.VITE_VIDEO_SERVICE_BASE_API;

interface VideoData {
  id: number
  userId: string
  videoUrl: string
  coverUrl: string
  title: string
  type: boolean
  duration: number
  area: number
  tags: []
  createAt: string
  updateAt: string
}

// interface UserProfile {
//   id: number
//   userId: number
//   nickname: string
//   gender: string
//   birthday: string
//   sign: string
//   announcement: string
//   avatar: string
//   coin: number
//   createAt: string
//   updateAt: string
// }

// interface User{
//   userId:number
//   avatar: string
// }

interface Video {
  video: VideoData
  uploaderName: string
  uploaderAvatar: string
  playCount: number
}

const videoDataList = ref<VideoData[]>([])
const videoList = ref<Video[]>([]);

// 处理视频点击事件
const handleVideoClick = (video: VideoData) => {
  // 跳转到视频详情页或其他处理
  console.log('点击视频:', video)
  // router.push(`/video/${video.id}`)
}

// 加载视频数据的方法（替换原有的加载用户数据方法）
const loadVideos = async () => {
  try {
    // TODO 修改获取收藏视频的API地址
    const res = await request.get(`${BASE_VEDIO_URL}/api/videos`)
    if (res.data.code === 200) {
      videoDataList.value = res.data.data
    }
  } catch (error) {
    console.error('加载视频失败:', error)
  }
}

onMounted(() => {
  loadVideos()
})
</script>
