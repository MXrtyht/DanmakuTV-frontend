<template>
  <div class="video-page">
    <el-row :gutter="20">
      <!-- 主要内容区域 -->
      <el-col :span="18">
        <!-- 视频播放器区域 -->
        <el-card class="video-card" shadow="never">
          <div class="video-player">
            <div class="video-placeholder">
              <el-icon size="48"><VideoPlay /></el-icon>
              <p>视频播放器占位</p>
              <p>视频ID: {{ videoId }}</p>
            </div>
          </div>
        </el-card>

        <!-- 视频信息区域 -->
        <el-card class="video-info-card" shadow="never">
          <div class="video-title">
            <h2>{{ videoInfo.title || '视频标题加载中...' }}</h2>
          </div>
          
          <div class="video-stats">
            <el-row align="middle">
              <el-col :span="12">
                <div class="stats-left">
                  <el-icon><View /></el-icon>
                  <span>{{ formatNumber(videoInfo.playCount) }} 播放</span>
                  <el-divider direction="vertical" />
                  <el-icon><Clock /></el-icon>
                  <span>{{ videoInfo.publishTime }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stats-right">
                  <el-button-group>
                    <el-button :icon="CaretTop">点赞</el-button>
                    <el-button :icon="Star">收藏</el-button>
                    <el-button :icon="Share">分享</el-button>
                  </el-button-group>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- UP主信息 -->
          <div class="uploader-info">
            <el-row align="middle">
              <el-col :span="16">
                <div class="uploader-profile">
                  <el-avatar :size="48" :src="videoInfo.uploaderAvatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <div class="uploader-details">
                    <div class="uploader-name">{{ videoInfo.uploaderName }}</div>
                    <div class="uploader-fans">粉丝数: {{ formatNumber(videoInfo.uploaderFans) }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="follow-button">
                  <el-button type="primary" round>+ 关注</el-button>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 视频描述 -->
          <div class="video-description">
            <el-collapse>
              <el-collapse-item title="视频简介" name="1">
                <p>{{ videoInfo.description || '暂无视频描述' }}</p>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>

        <!-- 评论区域 -->
        <el-card class="comment-card" shadow="never">
          <template #header>
            <div class="comment-header">
              <span>评论 ({{ commentCount }})</span>
            </div>
          </template>
          
          <!-- 发表评论 -->
          <div class="comment-input">
            <el-input
              v-model="newComment"
              type="textarea"
              placeholder="发表你的看法..."
              :rows="3"
              maxlength="500"
              show-word-limit
            />
            <div class="comment-actions">
              <el-button type="primary" @click="submitComment">发表评论</el-button>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="comment-list">
            <div class="comment-placeholder">
              <el-empty description="暂无评论，快来抢沙发吧！" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 侧边栏 -->
      <el-col :span="6">
        <!-- 相关推荐 -->
        <el-card class="recommendation-card" shadow="never">
          <template #header>
            <span>相关推荐</span>
          </template>
          
          <div class="recommendation-list">
            <div class="recommendation-placeholder">
              <el-empty description="推荐视频加载中..." />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { 
  VideoPlay, 
  View, 
  Clock, 
  CaretTop, 
  Star, 
  Share, 
  User 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const videoId = route.params.videoId

// 视频信息
interface VideoInfo {
  title: string
  playCount: number
  publishTime: string
  uploaderName: string
  uploaderAvatar: string
  uploaderFans: number
  description: string
}

const videoInfo = ref<VideoInfo>({
  title: '',
  playCount: 0,
  publishTime: '',
  uploaderName: '',
  uploaderAvatar: '',
  uploaderFans: 0,
  description: ''
})

// 评论相关
const commentCount = ref(0)
const newComment = ref('')

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

// 提交评论
const submitComment = () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  console.log('提交评论:', newComment.value)
  ElMessage.success('评论发表成功')
  newComment.value = ''
  // TODO: 实际提交评论到后端
}

// 加载视频信息
const loadVideoInfo = async () => {
  try {
    console.log('加载视频信息:', videoId)
    
    // TODO: 调用后端接口获取视频信息
    // 模拟数据
    videoInfo.value = {
      title: '这是一个很棒的视频标题',
      playCount: 12580,
      publishTime: '2024-01-15',
      uploaderName: 'UP主昵称',
      uploaderAvatar: '',
      uploaderFans: 5420,
      description: '这里是视频的详细描述信息...'
    }
    
    commentCount.value = 42
  } catch (error) {
    console.error('加载视频信息失败:', error)
    ElMessage.error('加载视频信息失败')
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

/* 视频播放器 */
.video-card {
  margin-bottom: 16px;
}

.video-player {
  width: 100%;
  height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--el-text-color-secondary);
}

/* 视频信息 */
.video-info-card {
  margin-bottom: 16px;
}

.video-title h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  line-height: 1.4;
}

.video-stats {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.stats-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.stats-right {
  text-align: right;
}

/* UP主信息 */
.uploader-info {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.uploader-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.uploader-details {
  flex: 1;
}

.uploader-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.uploader-fans {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.follow-button {
  text-align: right;
}

/* 评论区 */
.comment-card {
  margin-bottom: 16px;
}

.comment-input {
  margin-bottom: 20px;
}

.comment-actions {
  margin-top: 12px;
  text-align: right;
}

.comment-placeholder {
  padding: 40px 0;
}

/* 推荐区域 */
.recommendation-card {
  position: sticky;
  top: 20px;
}

.recommendation-placeholder {
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-page {
    padding: 10px;
  }
  
  .video-player {
    height: 250px;
  }
  
  .video-title h2 {
    font-size: 16px;
  }
  
  .stats-right {
    text-align: left;
    margin-top: 12px;
  }
}
</style>