<template>
  <div class="video-comments">
    <!-- 评论标题 -->
    <div class="comments-header">
      <h3 class="comments-title">评论 ({{ totalComments }})</h3>
    </div>

    <!-- 发送评论区域 -->
    <div class="comment-input-section">
      <div class="user-avatar">
        <el-avatar :size="40" :src="currentUserAvatar" />
      </div>
      <div class="input-container">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="3"
          placeholder="发一条友善的评论"
          class="comment-input"
          :maxlength="500"
          show-word-limit
        />
        <div class="input-actions">
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!newComment.trim()"
            @click="submitComment"
          >
            发表评论
          </el-button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-item"
      >
        <!-- 用户头像 -->
        <div class="comment-avatar">
          <el-avatar :size="36" :src="comment.userAvatar" />
        </div>

        <!-- 评论内容 -->
        <div class="comment-content">
          <!-- 用户名和时间 -->
          <div class="comment-header">
            <span class="username">{{ comment.username }}</span>
            <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
          </div>

          <!-- 评论文本 -->
          <div class="comment-text">
            {{ comment.content }}
          </div>

          <!-- 评论操作 -->
          <div class="comment-actions">
            <!-- 删除按钮（仅作者可见） -->
            <el-button
              v-if="comment.isAuthor"
              text
              size="small"
              type="danger"
              :icon="deleteIcon"
              :loading="comment.deleting"
              @click="deleteComment(comment)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="comments.length === 0 && !loading" class="empty-comments">
        <el-empty description="暂无评论，快来发表第一条评论吧~" />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-comments">
        <el-skeleton :rows="3" animated />
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalComments > 0" class="comments-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalComments"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

// Props
interface Props {
  videoId: number
}

const props = defineProps<Props>()

// 后端返回的评论数据类型
interface VideoComment {
  id: number
  userId: number
  videoId: number
  content: string
  createTime: string
}

// 前端展示用的评论数据类型
interface CommentDisplay {
  id: number
  userId: number
  username: string
  userAvatar: string
  content: string
  createTime: string
  isAuthor: boolean // 是否是当前用户发的评论
  deleting?: boolean // 删除中状态
}

// 分页响应类型
interface PageResponse<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 响应式数据
const comments = ref<CommentDisplay[]>([])
const newComment = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalComments = ref(0)
const loading = ref(false)
const submitting = ref(false)

// 环境变量
const INTERACTION_SERVICE_URL = import.meta.env.VITE_INTERACTION_SERVICE_BASE_API
const USER_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API

// 当前用户信息（实际应该从用户状态管理获取）
const currentUserAvatar = ref('')
const currentUserId = ref<number>(0)

// 用户信息缓存
const userCache = ref<Map<number, { nickname: string, avatar: string }>>(new Map())

// 图标
const deleteIcon = Delete

// 批量获取用户信息
const getBatchUserInfo = async (userIds: number[]): Promise<Map<number, { nickname: string, avatar: string }>> => {
  const userInfoMap = new Map<number, { nickname: string, avatar: string }>()
  
  // 过滤出未缓存的用户ID
  const uncachedUserIds = userIds.filter(id => !userCache.value.has(id))
  
  // 添加已缓存的用户信息
  userIds.forEach(id => {
    if (userCache.value.has(id)) {
      userInfoMap.set(id, userCache.value.get(id)!)
    }
  })

  if (uncachedUserIds.length === 0) {
    return userInfoMap
  }

  try {
    const response = await request.post(`${USER_SERVER_URL}/user/batch`, uncachedUserIds)

    if (response.data.code === 200 && response.data.data) {
      const userProfiles = response.data.data

      userProfiles.forEach((userInfo: any) => {
        const info = {
          nickname: userInfo.nickname || `用户${userInfo.userId}`,
          avatar: userInfo.avatar ? 
            `${BASE_MINIO_URL}/avatar/${userInfo.avatar}` : ''
        }
        
        userCache.value.set(userInfo.userId, info)
        userInfoMap.set(userInfo.userId, info)
      })
    }
  } catch (error) {
    console.error('批量获取用户信息失败:', error)
  }

  return userInfoMap
}

// 格式化时间
const formatTime = (timeStr: string): string => {
  const now = new Date()
  const commentTime = new Date(timeStr)
  const diff = now.getTime() - commentTime.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  
  return commentTime.toLocaleDateString()
}

// 加载当前用户信息
const loadCurrentUserInfo = async () => {
  try {
    // 这里应该从用户状态管理中获取当前用户信息
    // 暂时模拟获取当前用户ID
    const response = await request.get(`${USER_SERVER_URL}/user/info`)
    if (response.data.code === 200 && response.data.data) {
      currentUserId.value = response.data.data.userId
      currentUserAvatar.value = response.data.data.avatar ? 
        `${BASE_MINIO_URL}/avatar/${response.data.data.avatar}` : ''
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
  }
}

// 加载评论列表
const loadComments = async (page = 1) => {
  loading.value = true
  try {
    const response = await request.get(`${INTERACTION_SERVICE_URL}/video/video-comments`, {
      params: {
        videoId: props.videoId,
        page: page,
        size: pageSize.value
      }
    })

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '获取评论失败')
    }

    const pageData: PageResponse<VideoComment> = response.data.data
    const videoComments = pageData.records || []
    
    // 更新分页信息
    totalComments.value = pageData.total
    currentPage.value = pageData.current

    if (videoComments.length === 0) {
      comments.value = []
      return
    }

    // 提取所有用户ID
    const userIds = Array.from(new Set(videoComments.map(comment => comment.userId)))
    
    // 批量获取用户信息
    const userInfoMap = await getBatchUserInfo(userIds)

    // 组装评论显示数据
    comments.value = videoComments.map((comment: VideoComment) => {
      const userInfo = userInfoMap.get(comment.userId) || { nickname: `用户${comment.userId}`, avatar: '' }
      
      return {
        id: comment.id,
        userId: comment.userId,
        username: userInfo.nickname,
        userAvatar: userInfo.avatar,
        content: comment.content,
        createTime: comment.createTime,
        isAuthor: comment.userId === currentUserId.value
      } as CommentDisplay
    })

  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
    comments.value = []
  } finally {
    loading.value = false
  }
}

// 发表评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  submitting.value = true
  try {
    const addVideoCommentDTO = {
      userId: 0, // 后端会自动替换
      videoId: props.videoId,
      content: newComment.value.trim()
    }

    const response = await request.post(`${INTERACTION_SERVICE_URL}/video/add-comment`, addVideoCommentDTO)

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '发表评论失败')
    }

    ElMessage.success('评论发表成功')
    
    // 清空输入框
    newComment.value = ''
    
    // 重新加载第一页评论
    await loadComments(1)
    
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error('发表评论失败')
  } finally {
    submitting.value = false
  }
}

// 删除评论
const deleteComment = async (comment: CommentDisplay) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条评论吗？',
      '删除评论',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    comment.deleting = true
    
    const response = await request.post(`${INTERACTION_SERVICE_URL}/video/delete-comment`, comment.id, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '删除失败')
    }
    
    ElMessage.success('评论已删除')
    
    // 重新加载当前页评论
    await loadComments(currentPage.value)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除失败')
    }
  } finally {
    comment.deleting = false
  }
}

// 分页切换
const handlePageChange = (page: number) => {
  loadComments(page)
}

// 初始化
onMounted(async () => {
  await loadCurrentUserInfo()
  await loadComments()
})
</script>

<style scoped>
/* 样式保持不变 */
.video-comments {
  margin-top: 24px;
}

.comments-header {
  margin-bottom: 20px;
}

.comments-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

/* 评论输入区域 */
.comment-input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.user-avatar {
  flex-shrink: 0;
}

.input-container {
  flex: 1;
}

.comment-input {
  margin-bottom: 12px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
}

/* 评论列表 */
.comments-list {
  margin-bottom: 24px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.username {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.comment-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.comment-text {
  line-height: 1.6;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 空状态和加载状态 */
.empty-comments,
.loading-comments {
  padding: 40px 0;
  text-align: center;
}

/* 分页 */
.comments-pagination {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-input-section {
    flex-direction: column;
  }
  
  .comment-item {
    gap: 8px;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>