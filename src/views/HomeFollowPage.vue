<template>
  <div class="main-container">
    <!-- 左侧按钮列表 -->
    <div class="left-sidebar">
      <div class="add-button-container">
        <input
          v-model="newButtonName"
          placeholder="输入分组名称"
          @keyup.enter="addButton"
        >
        <button @click="addButton">添加分组</button>
      </div>
      <div
        v-for="(button, index) in buttonList"
        :key="index"
        class="custom-button"
        @click="selectButton(index)"
        :class="{ 'active': activeButtonIndex === index }"
      >
        {{ button.name }}
        <!-- 只有自定义分组才显示删除按钮 -->
        <span
          v-if="button.userId !== null"
          class="delete-btn"
          @click.stop="removeButton(index)"
        >
          ×
        </span>
      </div>
    </div>

    <!-- 右侧网格布局 -->
    <div class="right-content">
      <div class="user-grid">
        <div class="grid-container">
          <UserCard
            v-for="user in userList"
            :key="user.id"
            :user="user"
            default-text="已关注"
            second-text="取消关注"
            class="grid-item"
            @follow-change="handleFollowChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserCard from '@/components/userCard/UserCard.vue';
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
  userId: number | null
}

interface User {
  id: number
  name: string
  signature: string
  avatar: string
}

interface UserProfile {
  id: number
  userId: number
  nickname: string
  gender: string
  birthday: string
  sign: string
  announcement: string
  avatar: string
  coin: number
  createAt: string
  updateAt: string
}


const userLists = reactive<User[][]>([]);;
const buttonLists = ref<ButtonItem[]>([]);;
const userList = ref<User[]>()

const loadData = async () => {
  try {
    const response = await request.get(`${BASE_SERVER_URL}/user/follows`);
    const data = response.data;
    console.log(data)

    if (data.code !== 200 || !data.data) {
      ElMessage.error(data.message || '获取关注列表失败');
      return;
    }

    // 清空之前的数据
    userLists.length = 0;
    buttonLists.value.length = 0;

    // 去重处理（防止后端返回重复的分组）
    const uniqueGroups = data.data.filter((group: any, index: number, self: any[]) =>
      index === self.findIndex((g: any) => g.id === group.id)
    );

    for (const item of uniqueGroups) {
      // 过滤掉 userProfilesList 中的 null 用户，但保留分组的 userId: null
      const validProfiles = item.userProfilesList.filter((profile: UserProfile | null) => profile !== null);

      const userProfiles: User[] = validProfiles.map((profile: UserProfile) => ({
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
        userId: item.userId
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

const removeButton = (index: number) => {
  buttonList.value.splice(index, 1)
  if (activeButtonIndex.value === index) {
    activeButtonIndex.value = null
  } else if (activeButtonIndex.value !== null && activeButtonIndex.value > index) {
    activeButtonIndex.value -= 1
  }
  // TODO: 调后端API删除分组
  // TODO: 后端: 先把该分组中的关注人放到默认分组中 再删除
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
  const action = newState ? 'follow' : 'unfollow'

  try {
    const response = await request.post(`${BASE_SERVER_URL}/user/${action}`, {
      userId: userId
    });

    if (response.data.code !== 200 || !response.data.data) {
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

</script>

<style scoped>
.main-container {
  display: flex;
  height: 100vh;
}

.left-sidebar {
  width: 280px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 10px;
}

.add-button-container {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
}

.add-button-container input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-button-container button {
  padding: 8px 12px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-button-container button:hover {
  background-color: #66b1ff;
}

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

.delete-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  padding: 0 5px;
}

.delete-btn:hover {
  color: red;
}

.right-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.user-grid {
  width: 100%;
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
