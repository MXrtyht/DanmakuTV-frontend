<template>
  <div class="user-grid">
    <!-- 空状态提示 -->
    <div v-if="videoList.length === 0" class="empty-state">
      <el-empty description="暂无视频" />
    </div>

    <div v-else>
      <!-- 视频列表 -->
      <el-row :gutter="16">
        <!-- gutter 设置列间距 -->
        <el-col v-for="video in videoList" :key="video.video.id" :xs="24" :sm="12" :md="8" :lg="6">
          <VideoCard :video="video.video" :uploader-name="video.uploaderName" :uploader-avatar="video.uploaderAvatar" :play-count="video.playCount" @click="handleCardClick(video.video)"/>
        </el-col>
      </el-row>
      <!-- 分页控件 -->
      <el-pagination
        class="pagination-container"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pageData.total"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadVideos"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoCard from '@/components/videoCard/VideoCard.vue'
import request from '@/utils/request'
import { ref, onMounted } from 'vue'
import type { VideoData, VideoCardInfo } from '@/types/entity/video'
import type { IPage } from '@/types/api/iPage'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import router from '@/router'
import type { UserInfo } from '@/types/entity/user'

const BASE_VEDIO_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API
const BASE_USER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API

const videoList = ref<VideoCardInfo[]>([])

const pagination = ref({
  size: 10,
  page: 1,
})

const pageData = ref<IPage<VideoData>>({
  size: 10,
  current: 1,
  records: [],
  total: 0,
})

// 加载视频数据的方法（替换原有的加载用户数据方法）
const loadVideos = async () => {
  try {
    // 个人主页，都是同一个用户
    const userInfo= await request.get(`${BASE_USER_URL}/user/info`)
    if (userInfo.data.code !== 200 || !userInfo.data.data) {
      console.error('获取用户信息失败:', userInfo.data.message)
      ElMessage.error('获取用户信息失败，请稍后再试')
      return
    }
    const user = userInfo.data.data as UserInfo
    const res = await request.get(`${BASE_VEDIO_URL}/video/user`, {
      params: {
        size: pagination.value.size,
        page: pagination.value.page,
      },
    })
    if (res.data.code !== 200 || !res.data.data) {
      console.error('加载视频失败:', res.data.message)
      ElMessage.error('加载视频失败，请稍后再试')
      return
    }
    pageData.value = res.data.data

    const videoIdList:number[]=pageData.value.records.map((video)=>video.id)
    const videoCount=await request.get(`${BASE_VEDIO_URL}/video/video-view-counts-batch`,{
      params: { videoId: videoIdList },
      paramsSerializer: {
        indexes: null
      }
    })
    if (videoCount.data.code !== 200 || !videoCount.data.data) {
      console.error('获取视频播放量失败:', videoCount.data.message)
      ElMessage.error('获取视频播放量失败，请稍后再试')
      return
    }
    const countMap = new Map<number,number>(
      videoCount.data.data.map((item:{videoId:number,count:number}) => [item.videoId, item.count])
    );
    videoList.value = pageData.value.records.map((video) => ({
      video,
      uploaderName:user.nickname,
      uploaderAvatar: user.avatar,
      playCount:countMap.get(video.id)
    }))

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('注册失败:', error.response.data.message)
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
    } else {
      console.error('请求失败: 未知错误')
    }
  }
}

// 每页条数变化
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  loadVideos()
}

onMounted(() => {
  loadVideos()
})

const handleCardClick = (video: VideoData) => {
  // 处理视频卡片点击事件
  router.push(`/index/video/${video.id}`)
}
</script>

<style scoped>
.pagination-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
</style>
