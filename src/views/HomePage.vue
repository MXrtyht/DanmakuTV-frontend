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
        <el-col v-for="video in pageData.records" :key="video.id" :xs="24" :sm="12" :md="8" :lg="6">
          <VideoCard :video="video" />
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

const BASE_VEDIO_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API

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
    const res = await request.get(`${BASE_VEDIO_URL}/video/all`, {
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
    videoList.value = pageData.value.records.map((video) => ({
      video: video,
    }))
    // TODO 获取对应视频的用户和播放信息
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
