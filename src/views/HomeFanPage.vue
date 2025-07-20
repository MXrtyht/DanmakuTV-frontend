<template>
  <div class="fan-page">
    <!-- 粉丝列表 -->
    <div
      v-if="userList.length === 0"
      class="empty-state"
    >
      <el-empty description="您还没有任何粉丝" />
    </div>

    <el-row
      v-else
      :gutter="16"
    >
      <el-col
        v-for="user in userList"
        :key="user.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <UserCard
          :user="user"
          :is-followed="user.isFollowing"
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
import UserCard from '@/components/userCard/UserCard.vue';
import type { UserCardInfo, UserProfile } from '@/types/entity/user';
import type { UserFollowRequest, UserUnfollowRequest } from '@/types/request/userRequest';
import type { UserFanResponse } from '@/types/response/userResponse';
import request from '@/utils/request';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API;

// 存储粉丝数据
const fansList = ref<UserFanResponse[]>([]);

// 加载粉丝数据
const loadData = async () => {
  try {
    const response = await request.get(`${BASE_SERVER_URL}/user/fans`);
    const data = response.data;

    console.log(data)
    if (data.code !== 200) {
      console.error('获取粉丝列表失败:', data.message);
      ElMessage.error('获取粉丝列表失败');
      return;
    }

    if (!data.data || !Array.isArray(data.data)) {
      ElMessage.info('您还没有任何粉丝');
      fansList.value = [];
      return;
    }

    // 将后端返回的格式转换为 UserFanResponse 格式
    fansList.value = data.data.map((item: {
      userProfiles: UserProfile,
      isFollowBack: boolean
    }) => ({
      profile: item.userProfiles,
      isFollowing: item.isFollowBack
    } as UserFanResponse));

  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('获取粉丝列表失败:', error.response.data.message);
    } else if (error instanceof Error) {
      console.error('获取粉丝列表失败:', error.message);
    } else {
      console.error('获取粉丝列表失败: 未知错误');
    }
    ElMessage.error('获取粉丝列表失败');
  }
}

// 计算显示列表
const userList = computed<UserCardInfo[]>(() => {
  return fansList.value.map(fanResponse => ({
    id: fanResponse.profile.userId,
    name: fanResponse.profile.nickname,
    signature: fanResponse.profile.sign,
    avatar: fanResponse.profile.avatar && fanResponse.profile.avatar !== 'null'
      ? `${BASE_MINIO_URL}/avatar/${fanResponse.profile.avatar}`
      : '',
    isFollowing: fanResponse.isFollowing
  }))
});

// 处理关注状态变化
const handleFollowChange = async ({ newState, userId, onFailure }: {
  newState: boolean,
  userId: number,
  onFailure: () => void
}) => {
  console.log('状态变化:', newState, 'userId:', userId);

  try {
    let requestBody: UserFollowRequest | UserUnfollowRequest;
    let endpoint: string;

    if (newState) {
      // 回关操作
      endpoint = `${BASE_SERVER_URL}/user/follow`;
      requestBody = {
        userId: 0,
        followId: userId,
        groupId: 1,
        createAt: new Date().toISOString()
      } as UserFollowRequest;
    } else {
      // 取关操作
      endpoint = `${BASE_SERVER_URL}/user/unfollow`;
      requestBody = {
        userId: 0,
        followId: userId,
        groupId: 0
      } as UserUnfollowRequest;
    }

    const response = await request.post(endpoint, requestBody);

    if (response.data.code !== 200) {
      console.error('操作失败:', response.data.message);
      ElMessage.error('操作失败');
      onFailure();
      return;
    }

    // 更新本地状态
    const fanIndex = fansList.value.findIndex(fan =>
      fan.profile.userId === userId
    );

    if (fanIndex !== -1) {
      fansList.value[fanIndex].isFollowing = newState;
    }

    ElMessage.success(newState ? '回关成功' : '取消回关成功');

  } catch (error: unknown) {
    onFailure();
    if (axios.isAxiosError(error) && error.response) {
      console.error('请求失败:', error.response.data.message);
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message);
    } else {
      console.error('请求失败: 未知错误');
    }
    ElMessage.error('操作失败');
  }
}

onMounted(() => {
  loadData();
});
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
