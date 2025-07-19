<template>
  <div class="fan-page">
    <!-- 粉丝列表 -->
    <div v-if="userList.length === 0" class="empty-state">
      <el-empty description="您还没有任何粉丝" />
    </div>
    
    <el-row v-else :gutter="16">
      <el-col
        v-for="user in userList"
        :key="user.id"
        :xs="24" :sm="12" :md="8" :lg="6"
      >
        <UserCard 
          :user="user"
          default-text="已回关"
          second-text="回关"
          class="grid-item"
          @follow-change="handleFollowChange" 
        />
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
import type { UserFanResponse } from '@/types/response/userResponse';

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API;

onMounted(() => {
  loadData()
})

const userFollowMap = ref<Map<UserProfile, boolean>>(new Map());
const loadData = async () => {
  try{
    // 获取关注列表
    const response = await request.get(`${BASE_SERVER_URL}/user/fans`);
    const data = response.data;
    console.log(data)
    if(data.code !== 200){
      console.error('获取粉丝列表失败:', data.message);
      ElMessage.error('获取粉丝列表失败');
      return;
    }
    if(!data.data){
      ElMessage.info('您还没有任何粉丝');
      return;
    }

    // 将 Object.entries 的处理改为：
    Object.entries(data.data).forEach(([profileKey, isFollowing]) => {
      const profile = parseJavaObjectString(profileKey);
      
      const fanResponse: UserFanResponse = {
        profile: profile,
        isFollowing: isFollowing as boolean
      };
      
      userFollowMap.value.set(fanResponse.profile, fanResponse.isFollowing);
    });
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
    id: profile.userId, // 改为 userId，与 HomeFollowPage 保持一致
    name: profile.nickname,
    signature: profile.sign,
    avatar: profile.avatar && profile.avatar !== 'null'
      ? `${BASE_MINIO_URL}/avatar/${profile.avatar}`
      : ''
  }))
})

//解析函数
const parseJavaObjectString = (str: string): UserProfile => {
  // 提取括号内的内容
  const match = str.match(/UserProfiles\((.+)\)/);
  if (!match) throw new Error('Invalid format');
  
  // 解析键值对
  const pairs = match[1].split(', ');
  const result: Record<string, string | null> = {};
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    result[key] = value === 'null' ? null : value;
  });
  
  return result as unknown as UserProfile;
}
</script>

<style scoped>
.fan-page {
  padding: 20px;
  background-color: #fff;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.grid-item {
  margin-bottom: 16px;
}
</style>
