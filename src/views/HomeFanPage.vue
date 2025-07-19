<template>
  <div class="user-grid">
    <!-- 空状态提示 -->
    <div v-if="userList.length === 0"
      class="empty-state">
      <el-empty description="您还没有任何粉丝" />
    </div>
    <!-- 粉丝列表 -->
    <el-row v-else :gutter="16"
      class="grid-container">
      <el-col v-for="user in userList"
        :key="user.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        class="grid-item">
          <UserCard :user="user"
          default-text="已回关"
          second-text="回关"
          @follow-change="handleFollowChange" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import UserCard from '@/components/userCard/UserCard.vue'
import { computed,onMounted,ref } from 'vue'
import axios from 'axios';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
import type { UserProfile,UserCardInfo } from '@/types/entity/user'

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API;

onMounted(() => {
  loadData()
})

interface UserFan{
  profile: UserProfile
  isFollowing: boolean
}

const userFollowMap = ref<Map<UserProfile, boolean>>(new Map());
const loadData = async () => {
  try{
    // 获取关注列表
    const response = await request.get(`${BASE_SERVER_URL}/user/fans`);
    const data = response.data;
    if(data.code !== 200){
      console.error('获取粉丝列表失败:', data.message);
      ElMessage.error('获取粉丝列表失败');
      return;
    }
    if(!data.data){
      ElMessage.info('您还没有任何粉丝');
      return;
    }

    data.data.forEach((user:UserFan) => {
      userFollowMap.value.set(user.profile, user.isFollowing)
    })
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

const handleFollowChange = async ({ newState, userId, onFailure }:{newState:boolean,userId:number,onFailure:()=>void}) => {
  console.log('状态变化:', newState)
  const action = newState ? 'follow' : 'unfollow'
  try {
    // TODO API调用
    const response = await request.post(`${BASE_SERVER_URL}/user/${action}`, {
      userId: userId
    });
    if (response.data.code !== 200&&!response.data.data) {
      console.error('操作失败:', response.data.message);
      ElMessage.error('操作失败');
      onFailure();
      return;
    }
    ElMessage.success(newState ? '回关' : '已取消回关');
  } catch (error: unknown) {
    onFailure();
    if (axios.isAxiosError(error) && error.response) {
      console.error('请求失败:', error.response.data.message);
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message);
    } else {
      console.error('请求失败: 未知错误');
    }
  }
}

const userList = computed<UserCardInfo[]>(() => {
  return Array.from(userFollowMap.value.keys()).map(profile => ({
      id: profile.id,
      name: profile.nickname,
      signature: profile.sign,
      avatar: `${BASE_MINIO_URL}/avatar/${profile.avatar}`
    }))
  })
</script>

<style scoped>
.user-grid {
  padding: 20px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.grid-item {
  width: 100%;
}
</style>
