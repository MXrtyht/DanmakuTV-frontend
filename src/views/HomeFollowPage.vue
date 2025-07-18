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
        <span class="delete-btn" @click.stop="removeButton(index)">×</span>
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
            class="grid-item"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted,ref } from 'vue'
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
  id: string
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


const userLists:User[][]=[];
const buttonLists:ButtonItem[]=[];
let userList = ref<User[]>()

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
      buttonLists.push(buttonItem);
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
const buttonList = ref<ButtonItem[]>(buttonLists)
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

const selectButton = (index: number) => {
  activeButtonIndex.value = index
  userList= ref(userLists[index] || [])
  // 这里可以添加按钮点击后的逻辑
  console.log(`选中按钮: ${buttonList.value[index].name}`)
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
