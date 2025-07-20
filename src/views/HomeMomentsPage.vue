<template>
  <div class="activity-page">

    <!-- 动态列表 -->
    <div>
      <el-card
        v-for="activity in activities"
        :key="activity.id.toString()"
        class="activity-card"
        shadow="hover"
      >
        <div class="activity-item">
          <!-- 活动图标 -->
          <div class="activity-icon">
            <el-avatar
              :size="32"
              :src="userAvatar"
              :fit="'cover'"
            />
          </div>

          <!-- 活动内容 -->
          <div class="activity-content">
            <!-- 活动描述 -->
            <div class="activity-description">
              <span class="activity-text">{{ activity.description }}</span>
            </div>

            <!-- 相关内容预览 -->
            <div v-if="activity.video" class="activity-preview">
              <div v-if="activity.video.title" class="preview-title">
                {{ activity.video.title }}
              </div>
              <div v-if="activity.video.description" class="preview-excerpt">
                {{ activity.video.description }}
              </div>
              <el-image
                v-if="activity.video.cover"
                :src="activity.video.cover"
                class="preview-image"
                fit="cover"
              />
            </div>

            <!-- 时间 -->
            <div class="activity-footer">
              <span class="activity-time">{{ formatTime(activity.time) }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 加载更多 -->
      <div class="load-more">
        <div class="no-more">
          没有更多动态了
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserMoment } from '@/types/entity/user'
import axios from 'axios'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const MINIO_SERVICE_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_BASE_API

const activities = ref<UserMoment[]>([])
const userAvatar=ref('')

// 模拟数据
const mockActivities = [
  {
    id: 1,
    description: '发布了一篇新文章',
    video: {
      title: 'Vue3 开发实践总结',
      description: '分享一些在Vue3项目开发中的经验和心得...',
      cover: 'https://via.placeholder.com/300x200'
    },
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    description: '赞了这篇文章',
    video: {
      title: 'Element Plus 组件库使用指南',
      description: '详细介绍Element Plus的各种组件使用方法...',
      cover: 'https://via.placeholder.com/300x200'
    },
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 3,
    description: '评论了文章',
    video: {
      title: 'JavaScript异步编程详解',
      description: '很实用的文章，学到了很多新知识！',
      cover: 'https://via.placeholder.com/300x200'
    },
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
]

const formatTime = (time:Date) => {
  const now:Date = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return `${days}天前`
  }
}

const loadData = async () => {
  try{
    // TODO 获取用户动态
    // const userMoment = await request.get('/user/moments');
    const userInfo = await request.get(`${USER_SERVICE_URL}/user/info`);
    console.log('用户信息:', userInfo.data);
    if(userInfo.data.code !== 200 || !userInfo.data.data){
      console.error('获取用户信息失败:', userInfo.data.message);
      ElMessage.error('获取用户信息失败');
      return;
    }
    userAvatar.value = userInfo.data.data.avatar ? `${MINIO_SERVICE_URL}/avatar/${userInfo.data.data.avatar}` : ''
  }
  catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
        console.error('注册失败:', error.response.data.message);
    } else if (error instanceof Error) {
        console.error('请求失败:', error.message);
    } else {
        console.error('请求失败: 未知错误');
    }
  }
}

// 生命周期
onMounted(() => {
  activities.value = [...mockActivities]
  loadData()
})
</script>

<style scoped>
.activity-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.filter-section {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.activity-card {
  margin-bottom: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.activity-card:hover {
  transform: translateY(-2px);
}

.activity-item {
  display: flex;
  gap: 16px;
}

.activity-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-description {
  margin-bottom: 12px;
}

.activity-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.activity-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid #409EFF;
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
}

.preview-excerpt {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
}

.preview-image {
  width: 100%;
  max-width: 300px;
  height: 180px;
  border-radius: 6px;
  object-fit: cover;
}

.activity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.activity-actions {
  display: flex;
  gap: 16px;
}

.activity-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
  color: #909399;
  transition: color 0.3s ease;
}

.activity-actions .el-button:hover {
  color: #409EFF;
}

.activity-actions .el-button.is-liked {
  color: #F56C6C;
}

.load-more {
  text-align: center;
  margin-top: 32px;
  padding: 20px;
}

.load-more-btn {
  font-size: 14px;
  color: #409EFF;
  padding: 12px 24px;
}

.no-more {
  color: #909399;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activity-page {
    padding: 16px;
  }

  .filter-buttons {
    width: 100%;
    overflow-x: auto;
  }

  .activity-item {
    gap: 12px;
  }

  .activity-icon {
    width: 36px;
    height: 36px;
  }

  .preview-image {
    max-width: 100%;
    height: 150px;
  }
}
</style>
