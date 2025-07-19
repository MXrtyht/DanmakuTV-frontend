<template>
  <!-- 固定导航菜单容器 -->
  <div :class="['headerBar-sticky-menu-container', { 'is-sticky': sticky }]">
    <el-menu
      mode="horizontal"
      background-color="transparent"
      active-text-color="#409EFF"
      class="header-menu"
      :router="false"
    >
      <!-- 左侧 Logo -->
      <div class="left-section">
        <el-menu-item
          index="logo"
          class="logo-item"
          @click="goHome"
        >
          <span class="logo-text">DanmakuTV</span>
        </el-menu-item>
      </div>

      <!-- 中间搜索框 -->
      <div class="center-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索视频、UP主"
          class="search-input"
          clearable
          size="default"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button
              @click="handleSearch"
              :icon="Search"
            />
          </template>
        </el-input>
      </div>

      <!-- 右侧导航项 -->
      <div class="right-section">
        <!-- 用户头像 -->
        <el-dropdown
          trigger="click"
          @command="handleCommand"
        >
          <el-avatar
            :size="36"
            :src="userInfo.avatar"
            class="user-avatar"
            style="cursor: pointer;"
          >
            <el-icon>
              <User />
            </el-icon>
          </el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
              <el-dropdown-item
                divided
                command="logout"
              >退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 动态 -->
        <el-menu-item
          index="dynamic"
          class="nav-menu-item"
          @click="handleDynamic"
        >
          <span>动态</span>
        </el-menu-item>

        <!-- 收藏 -->
        <el-menu-item
          index="favorite"
          class="nav-menu-item"
          @click="handleFavorite"
        >
          <span>收藏</span>
        </el-menu-item>

        <!-- 历史 -->
        <el-menu-item
          index="history"
          class="nav-menu-item"
          @click="handleHistory"
        >
          <span>历史</span>
        </el-menu-item>

        <!-- 投稿按钮 -->
        <el-button
          type="primary"
          class="upload-btn"
          size="default"
          round
          @click="handleUpload"
        >
          投稿
        </el-button>
      </div>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { Search, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref,watch } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import type { UserInfo } from '@/types/entity/user'

const router = useRouter()

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API

// 搜索关键词
const searchKeyword = ref('')

// 前端用户信息
interface FrontendUserInfo {
  avatar: string
  name: string
}

const userInfo = ref<FrontendUserInfo>({
  avatar: '',
  name: ''
})

const props=defineProps({
  sticky: {
    type: Boolean,
    default: true // 默认固定
} })

watch(() => props.sticky, (val) => {
  console.log('sticky prop changed:', val) // 确认值是否正确
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const userInfoRes = await request.get(`${BASE_SERVER_URL}/user/info`)

    if (userInfoRes.data.code !== 200) {
      console.error('获取用户信息失败:', userInfoRes.data.message)
      ElMessage.error('获取用户信息失败')
      return
    }

    const backendUserInfo = userInfoRes.data.data as UserInfo
    userInfo.value = {
      avatar: backendUserInfo.avatar
        ? `${BASE_MINIO_URL}/avatar/${backendUserInfo.avatar}`
        : '',
      name: backendUserInfo.nickname
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    console.log('搜索:', searchKeyword.value)
    ElMessage.info(`搜索: ${searchKeyword.value}`)
    // TODO: 实现搜索功能
  }
}

// 首页跳转
const goHome = () => {
  router.push('/index')
}

// 投稿处理
const handleUpload = () => {
  console.log('跳转到投稿页面')
  ElMessage.info('跳转到投稿页面')
  // TODO: 跳转到投稿页面
}

// 历史处理
const handleHistory = () => {
  console.log('跳转到历史页面')
  ElMessage.info('跳转到历史页面')
  // TODO: 跳转到历史页面
}

// 收藏处理
const handleFavorite = () => {
  console.log('跳转到收藏页面')
  ElMessage.info('跳转到收藏页面')
  // TODO: 跳转到收藏页面
}

// 动态处理
const handleDynamic = () => {
  console.log('跳转到动态页面')
  ElMessage.info('跳转到动态页面')
  // TODO: 跳转到动态页面
}

// 下拉菜单处理
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/home')
      break
    case 'settings':
      router.push('/home/edit')
      break
    case 'logout':
      ElMessage.warning('退出登录功能待实现')
      // TODO: 实现退出登录
      break
  }
}

// 初始化
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
/* 默认导航菜单容器 */
.headerBar-sticky-menu-container {
  background-color: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 固定导航菜单容器 */
.headerBar-sticky-menu-container.is-sticky {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  border-bottom: 1px solid var(--el-border-color-light);
  border-right: none;
}

/* 左侧区域 */
.left-section {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.logo-item {
  padding: 0 !important;
  height: auto !important;
  line-height: normal !important;
  border-bottom: none !important;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: var(--el-color-primary);
  cursor: pointer;
}

/* 中间搜索区域 */
.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 40px;
}

.search-input {
  width: 100%;
  max-width: 500px;
}

/* 右侧区域 */
.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  justify-content: flex-end;
}

/* 投稿按钮 */
.upload-btn {
  font-weight: 500;
}

/* 导航菜单项 */
.nav-menu-item {
  height: auto !important;
  padding: 8px 12px !important;
  line-height: normal !important;
  border-bottom: none !important;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-menu-item:hover {
  background-color: var(--el-fill-color-light) !important;
  color: var(--el-color-primary) !important;
}

.nav-menu-item span {
  font-size: 14px;
}

/* 用户头像 */
.user-avatar {
  border: 2px solid var(--el-border-color-light);
  transition: all 0.2s;
}

.user-avatar:hover {
  border-color: var(--el-color-primary);
  transform: scale(1.05);
}

/* 移除菜单项的默认下划线 */
.el-menu--horizontal>.el-menu-item {
  border-bottom: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-menu {
    padding: 8px 16px;
    flex-wrap: wrap;
    height: auto;
  }

  .center-section {
    order: 3;
    width: 100%;
    margin: 10px 0 0 0;
  }

  .right-section {
    gap: 12px;
    min-width: auto;
  }

  .nav-menu-item span {
    font-size: 12px;
  }

  .upload-btn {
    padding: 8px 16px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .right-section {
    gap: 8px;
  }

  .nav-menu-item {
    padding: 6px 8px !important;
  }

  .nav-menu-item span {
    display: none;
  }
}
</style>
