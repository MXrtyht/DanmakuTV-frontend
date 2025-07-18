<template>
  <div class="user-card">
    <!-- 左侧图片 -->
    <div class="left">
      <img :src="user.avatar" alt="用户头像" class="avatar">
    </div>

    <!-- 右侧内容 -->
    <div class="right">
      <div class="username">{{ user.name }}</div>
      <div class="signature">{{ user.signature }}</div>
      <button
        class="follow-btn"
        @click="toggleFollow"
        :class="{ 'unfollow': isFollowing }"
      >
        {{ isFollowing ? '取消关注' : '关注' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface User {
  id: string
  name: string
  signature: string
  avatar: string
}

defineProps<{ user: User }>()

// 定义emit事件（如果需要）
const emit = defineEmits<{
  (e: 'follow-change', isFollowing: boolean): void
}>()

// 响应式状态
const isFollowing = ref(false)

// 方法
const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  // 可以在这里添加API调用
  emit('follow-change', isFollowing.value)
}
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
}

.left {
  flex-shrink: 0;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.username {
  font-size: 16px;
  font-weight: bold;
}

.signature {
  font-size: 14px;
  color: #666;
}

.follow-btn {
  align-self: flex-start;
  padding: 4px 12px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.follow-btn.unfollow {
  background-color: #f56c6c;
}
</style>
