<template>
  <el-container class="main-container">
    <!-- 左侧按钮列表 - 使用 el-aside -->
    <el-aside width="280px" class="left-sidebar">
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
          <el-button
            class="delete-btn"
            type="danger"
            @click.stop="removeButton(index)"
          >删除</el-button>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧网格布局 - 使用 el-main -->
    <el-main class="right-content">
      <el-row :gutter="16">
        <el-col
          v-for="user in userList"
          :key="user.id"
          :xs="24" :sm="12" :md="8" :lg="6"
        >
          <UserCard
            :user="user"
            default-text="已关注"
            second-text="取消关注"
            class="grid-item"
            @follow-change="handleFollowChange"
          />
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { reactive,onMounted,ref } from 'vue'
import UserCard from '@/components/userCard/UserCard.vue'
import axios from 'axios';
import { ElMessage } from 'element-plus';

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API;

onMounted(() => {
  loadData()
})

interface ButtonItem {
  name: string
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


const userLists=reactive<User[][]>([]);;
const buttonLists=ref<ButtonItem[]>([]);;
const userList = ref<User[]>()

const loadData = async () => {
  try{
    // 获取关注列表
    const response = await axios.get(`${BASE_SERVER_URL}/user/follows`);
    const data = response.data;
    if(data.code !== 200 && !data.data){
      console.error('获取关注列表失败:', data.message);
      ElMessage.error('获取关注列表失败');
      return;
    }

    for (const item of data.data) {
      const userProfiles: User[] = item.userProfilesList.map((profile: UserProfile) => ({
        id: profile.id.toString(),
        name: profile.nickname,
        signature: profile.sign,
        avatar: `${BASE_MINIO_URL}/avatar/${profile.avatar}`
      }));
      userLists.push(userProfiles);
      const buttonItem: ButtonItem = {
        name: item.name
      };
      buttonLists.value.push(buttonItem);
    }

  } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
          console.error('注册失败:', error.response.data.message);
      } else if (error instanceof Error) {
          console.error('请求失败:', error.message);
      } else {
          console.error('请求失败: 未知错误');
      }
  }
}

const newButtonName = ref('')
// 初始化按钮列表
const buttonList = ref<ButtonItem[]>(buttonLists.value)
const activeButtonIndex = ref<number | null>(null)

const addButton = () => {
  if (newButtonName.value.trim()) {
    buttonList.value.push({
      name: newButtonName.value.trim()

    })
    newButtonName.value = ''
  }
}

const removeButton = (index: number) => {
  buttonList.value.splice(index, 1)
  if (activeButtonIndex.value === index) {
    activeButtonIndex.value = null
  } else if (activeButtonIndex.value !== null && activeButtonIndex.value > index) {
    activeButtonIndex.value -= 1
  }
}

// 点击左侧按钮
const selectButton = (index: number) => {
  activeButtonIndex.value = index
  userList.value = userLists[index] || [];
  // 这里可以添加按钮点击后的逻辑
  console.log(`选中按钮: ${buttonList.value[index].name}`)
}

// 按钮点击
const handleFollowChange = async ({ newState, userId, onFailure }:{newState:boolean,userId:number,onFailure:()=>void}) => {
  console.log('状态变化:', newState)
  const action = newState ? 'follow' : 'unfollow'
  try {
    // TODO API调用
    const response = await axios.post(`${BASE_SERVER_URL}/user/${action}`, {
      userId: userId
    });
    if (response.data.code !== 200&&!response.data.data) {
      console.error('操作失败:', response.data.message);
      ElMessage.error('操作失败');
      onFailure();
      return;
    }
    ElMessage.success(newState ? '已关注' : '已取消关注');
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
