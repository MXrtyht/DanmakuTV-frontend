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

    <!-- 关注分组选择弹窗 -->
    <FollowGroupSelector
      v-model="followDialogVisible"
      title="选择关注分组"
      confirm-text="确认回关"
      @confirm="handleFollowConfirm"
      @cancel="handleFollowCancel"
    />
  </div>
</template>

<script setup lang="ts">
import FollowGroupSelector from '@/components/FollowGroupSelector/FollowGroupSelector.vue';
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

// 关注分组选择弹窗状态
const followDialogVisible = ref(false);
let pendingFollowUserId: number | null = null;
let pendingOnFailure: (() => void) | null = null;

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

  if (newState) {
    // 回关操作 - 显示分组选择弹窗
    pendingFollowUserId = userId;
    pendingOnFailure = onFailure;
    followDialogVisible.value = true;
  } else {
    // 取关操作 - 直接执行
    await executeUnfollow(userId, onFailure);
  }
};

// 关注分组选择确认
const handleFollowConfirm = async (groupId: number) => {
  if (pendingFollowUserId === null || pendingOnFailure === null) return;

  try {
    const requestBody: UserFollowRequest = {
      userId: 0,
      followId: pendingFollowUserId,
      groupId: groupId,
      createAt: new Date().toISOString()
    };

    const response = await request.post(`${BASE_SERVER_URL}/user/follow`, requestBody);

    if (response.data.code !== 200) {
      console.error('回关失败:', response.data.message);
      ElMessage.error('回关失败');
      pendingOnFailure();
      return;
    }

    // 更新本地状态
    const fanIndex = fansList.value.findIndex(fan =>
      fan.profile.userId === pendingFollowUserId
    );

    if (fanIndex !== -1) {
      fansList.value[fanIndex].isFollowing = true;
    }

    ElMessage.success('回关成功');

  } catch (error: unknown) {
    if (pendingOnFailure) pendingOnFailure();
    if (axios.isAxiosError(error) && error.response) {
      console.error('回关失败:', error.response.data.message);
    } else if (error instanceof Error) {
      console.error('回关失败:', error.message);
    } else {
      console.error('回关失败: 未知错误');
    }
    ElMessage.error('回关失败');
  } finally {
    // 清理状态
    pendingFollowUserId = null;
    pendingOnFailure = null;
  }
};

// 关注分组选择取消
const handleFollowCancel = () => {
  if (pendingOnFailure) {
    pendingOnFailure();
  }
  pendingFollowUserId = null;
  pendingOnFailure = null;
};

// 执行取关操作
const executeUnfollow = async (userId: number, onFailure: () => void) => {
  try {
    const requestBody: UserUnfollowRequest = {
      userId: 0,
      followId: userId,
      groupId: 0
    };

    const response = await request.post(`${BASE_SERVER_URL}/user/unfollow`, requestBody);

    if (response.data.code !== 200) {
      console.error('取关失败:', response.data.message);
      ElMessage.error('取关失败');
      onFailure();
      return;
    }

    // 更新本地状态
    const fanIndex = fansList.value.findIndex(fan =>
      fan.profile.userId === userId
    );

    if (fanIndex !== -1) {
      fansList.value[fanIndex].isFollowing = false;
    }

    ElMessage.success('取消回关成功');

  } catch (error: unknown) {
    onFailure();
    if (axios.isAxiosError(error) && error.response) {
      console.error('取关失败:', error.response.data.message);
    } else if (error instanceof Error) {
      console.error('取关失败:', error.message);
    } else {
      console.error('取关失败: 未知错误');
    }
    ElMessage.error('取关失败');
  }
};

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
