<template>
  <el-container class="main-container">
    <!-- 左侧按钮列表 - 使用 el-aside -->
    <el-aside
      width="280px"
      class="left-sidebar"
    >
      <div class="add-button-container">
        <el-input
          v-model="newButtonName"
          placeholder="输入分组名称"
          @keyup.enter="addButton"
          clearable
          class="custom-input"
        >
          <template #append>
            <el-button
              type="primary"
              class="add-btn"
              @click="addButton"
            >添加分组</el-button>
          </template>
        </el-input>
      </div>

      <el-menu
        :default-active="activeButtonIndex?.toString()"
        class="button-menu"
      >
        <el-menu-item
          v-for="(button, index) in buttonList"
          :key="index"
          :index="index.toString()"
          class="custom-button"
          @click="selectButton(index)"
          :class="{ 'active': activeButtonIndex === index }"
        >
          <span class="button-text">{{ button.name }}</span>
          <!-- 只有自定义分组才显示删除按钮 -->
          <el-button
            v-show="button.groupId !== 1"
            class="delete-btn"
            type="danger"
            @click.stop="removeButton(index)"
          >删除</el-button>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧网格布局 - 使用 el-main -->
    <el-main class="right-content">
      <div
        v-if="userList === null || userList === undefined || userList.length === 0"
        class="empty-state"
      >
        <el-empty description="当前内容为空" />
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
            :is-followed="true"
            default-text="已关注"
            second-text="关注"
            class="grid-item"
            @follow-change="handleFollowChange"
          />
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import UserCard from '@/components/userCard/UserCard.vue';
import type { UserCardInfo, UserProfile } from '@/types/entity/user';
import type { UserFollowRequest, UserUnfollowRequest } from '@/types/request/userRequest';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API;

onMounted(() => {
  loadData()
})

interface ButtonItem {
  name: string
  groupId: number | null
}

const userLists = reactive<UserCardInfo[][]>([]);
const buttonLists = ref<ButtonItem[]>([]);
const userList = ref<UserCardInfo[]>()

const loadData = async () => {

  try {
    // 获取关注列表
    const response = await request.get(`${BASE_SERVER_URL}/user/follows`);
    const data = response.data;

    console.log(data.data)
    if (data.code !== 200 || !data.data) {
      ElMessage.error(data.message || '获取关注列表失败');
      return;
    }

    // 清空之前的数据
    userLists.length = 0;
    buttonLists.value.length = 0;

    for (const item of data.data) {
      // 过滤掉 userProfilesList 中的 null 用户，保留分组的 userId: null
      const validProfiles = item.userProfilesList.filter((profile: UserProfile | null) => profile !== null);

      const userProfiles: UserCardInfo[] = validProfiles.map((profile: UserProfile) => ({
        id: profile.userId, // 使用 userId 作为用户ID
        name: profile.nickname,
        signature: profile.sign,
        avatar: profile.avatar && profile.avatar !== 'null'
          ? `${BASE_MINIO_URL}/avatar/${profile.avatar}`
          : ''
      }));

      userLists.push(userProfiles);

      const buttonItem: ButtonItem = {
        name: item.name,
        groupId: item.id
      };
      buttonLists.value.push(buttonItem);
    }

    // 更新按钮列表并初始化显示
    buttonList.value = [...buttonLists.value];

    // 默认选中第一个分组
    if (userLists.length > 0) {
      activeButtonIndex.value = 0;
      userList.value = userLists[0];
    }

  } catch (error) {
    console.error('获取关注列表失败:', error);
  }
}
const newButtonName = ref('')
// 初始化按钮列表
const buttonList = ref<ButtonItem[]>(buttonLists.value)
const activeButtonIndex = ref<number | null>(null)

const addButton = async () => {
  if (newButtonName.value.trim()) {
    try {
      // 调用后端API创建新分组
      const response = await request.post(`${BASE_SERVER_URL}/user/follow-group`, {
        userId: 0, // 随便传个数字，后端会校验替换
        name: newButtonName.value.trim()
      });

      if (response.data.code !== 200) {
        ElMessage.error(response.data.message || '创建分组失败');
        return;
      }

      ElMessage.success('分组创建成功');
      newButtonName.value = '';

      // 重新加载列表
      await loadData();

    } catch (error) {
      console.error('创建分组失败:', error);
    }
  }
}

const removeButton = async (index: number) => {
  try {
    // 获取要删除的分组信息
    const buttonToDelete = buttonList.value[index];
    console.log(buttonToDelete.groupId)
    if (!buttonToDelete || buttonToDelete.groupId === 1) {
      ElMessage.error('无法删除默认分组');
      return;
    }

    // 调用后端API删除分组
    const response = await request.post(`${BASE_SERVER_URL}/user/delete-follow-group`, buttonToDelete.groupId, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '删除分组失败');
      return;
    }

    // API调用成功后，更新本地状态
    buttonList.value.splice(index, 1);
    userLists.splice(index, 1);

    // 处理活动索引
    if (activeButtonIndex.value === index) {
      // 如果删除的是当前选中的分组，选中第一个分组
      activeButtonIndex.value = buttonList.value.length > 0 ? 0 : null;
      userList.value = buttonList.value.length > 0 ? userLists[0] : [];
    } else if (activeButtonIndex.value !== null && activeButtonIndex.value > index) {
      // 如果删除的分组在当前选中分组之前，调整索引
      activeButtonIndex.value -= 1;
    }

    ElMessage.success('删除分组成功');

  } catch (error) {
    console.error('删除分组失败:', error);
    ElMessage.error('删除分组失败');
  }
}

// 点击左侧按钮
const selectButton = (index: number) => {
  activeButtonIndex.value = index
  userList.value = userLists[index] || [];
  // 这里可以添加按钮点击后的逻辑
  console.log(`选中按钮: ${buttonList.value[index].name}`)
}

// 关注按钮点击
const handleFollowChange = async ({ newState, userId, onFailure }: { newState: boolean, userId: number, onFailure: () => void }) => {
  console.log('状态变化:', newState)

  try {
    let requestBody: UserFollowRequest | UserUnfollowRequest;
    let endpoint: string;

    if (newState) {
      // 关注操作
      endpoint = `${BASE_SERVER_URL}/user/follow`;
      requestBody = {
        userId: 0,
        followId: userId,
        groupId: getCurrentGroupId(),
        createAt: new Date().toISOString()
      } as UserFollowRequest;
    } else {
      // 取关操作
      endpoint = `${BASE_SERVER_URL}/user/unfollow`;
      requestBody = {
        userId: 0,
        followId: userId,
        groupId: getCurrentGroupId()
      } as UserUnfollowRequest;
    }

    const response = await request.post(endpoint, requestBody);

    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '操作失败');
      onFailure();
      return;
    }

    ElMessage.success(newState ? '关注成功' : '取消关注成功');

  } catch (error) {
    console.error('关注操作失败:', error);
    onFailure();
  }
}

// 获取关注的用户当前所在的组
const getCurrentGroupId = (): number => {
  if (activeButtonIndex.value !== null && buttonList.value[activeButtonIndex.value]) {
    return buttonList.value[activeButtonIndex.value].groupId || 1;
  }
  return 1; // 默认分组
};

</script>

<style scoped>
.main-container {
  height: 100vh;
}

.left-sidebar {
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.add-button-container {
  padding: 10px;
  background-color: #fff;
}

.button-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none;
}

/* 按钮列表容器 */
.button-list-container {
  flex: 1;
  overflow-y: auto;
}

/* 自定义按钮样式 - 保持原有外观 */
.custom-button {
  position: relative;
  padding: 10px 15px;
  margin-bottom: 8px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.custom-button:hover {
  background-color: #f0f0f0;
}

.custom-button.active {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
}

/* 按钮文字样式 */
.button-text {
  display: block;
  width: calc(100% - 20px);
}

.delete-btn {
  position: absolute;
  right: 10px;
  font-size: 16px;
  color: #d6cdcd;
}

.right-content {
  padding: 20px;
  background-color: #fff;
}

.grid-item {
  margin-bottom: 16px;
}
</style>
