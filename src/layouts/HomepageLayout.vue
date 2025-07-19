<template>
  <div>
    <HeaderBar :sticky="false"/>
    <!-- 新增的头部背景区域 -->
    <div class="profile-header">
      <!-- 背景图片 -->
      <div class="header-background"></div>
      <!-- 头像和用户信息 -->
      <div class="profile-info">
        <el-avatar
          :size="80"
          class="user-avatar"
          :src="userInfo.avatar"
        > </el-avatar>
        <div class="user-name">
          {{ userInfo.name }}
        </div>
      </div>
    </div>
    <!-- 固定导航菜单容器 -->
    <div class="homePage-sticky-menu-container">
      <el-menu
        mode="horizontal"
        background-color="transparent"
        active-text-color="#409EFF"
        class="header-menu"
        :router="true"
        :default-active="activeMenu"
      >
        <!-- 左侧导航项 -->
        <div class="left-menus">
          <el-menu-item index="/home">个人主页</el-menu-item>
          <el-menu-item index="/home/home">动态</el-menu-item>
          <el-menu-item index="/home/home">投稿</el-menu-item>
          <el-menu-item index="/home/collect">收藏</el-menu-item>
          <el-menu-item index="/home/edit">设置</el-menu-item>
        </div>

        <!-- 右侧导航项 -->
        <div class="right-menus">
          <!-- 垂直排列的统计项 -->
          <el-menu-item
            index="/home/follow"
            class="vertical-menu-item"
          >
            <div class="vertical-stats">
              <div class="stat-label">关注者</div>
              <div class="stat-value">{{ formattedStats.follow }}</div>
            </div>
          </el-menu-item>

          <el-menu-item
            index="/home/fan"
            class="vertical-menu-item"
          >
            <div class="vertical-stats">
              <div class="stat-label">粉丝数</div>
              <div class="stat-value">{{ formattedStats.fan }}</div>
            </div>
          </el-menu-item>
        </div>
      </el-menu>
    </div>
    <main class="content">
      <router-view />
      <!-- 子路由内容在此展示 -->
    </main>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomepageLayout' })
import request from '@/utils/request'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBar from '@/components/headerBar/HeaderBar.vue'

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API;

// 菜单跳转
const route = useRoute() // 动态计算激活菜单
const activeMenu = computed(() => {
  return route.path // 直接使用当前路由路径 // 或者处理嵌套路由： // return '/' + route.path.split('/')[1]
})

// 获取关注者和粉丝数
onMounted(() => {
  loadData()
})

interface UserInfo {
  userId: number
  nickname: string
  gender: string
  birthday: string
  sign: string
  announcement: string
  avatar: string
  coin: number
}

// 前端使用的用户信息结构
interface FrontendUserInfo {
  avatar: string
  name: string // 可以添加其他需要展示的字段
}
const userInfo = ref<FrontendUserInfo>({
  avatar: '',
  name: ''
})

const stats = ref({
  follow: 0, // 关注者
  fan: 0 // 粉丝数
})

const loadData = async () => {
  try {
    // 获取关注列表
    const userInfoRes = await request.get(`${BASE_SERVER_URL}/user/info`)
    const followCountRes = await request.get(`${BASE_SERVER_URL}/user/follow-count`)
    const fansCountRes = await request.get(`${BASE_SERVER_URL}/user/fans-count`)
    if (userInfoRes.data.code !== 200) {
      console.error('获取用户信息失败:', userInfoRes.data.message)
      ElMessage.error('获取用户信息失败')
      return
    }
    if (followCountRes.data.code !== 200) {
      console.error('获取关注总数失败:', followCountRes.data.message)
      ElMessage.error('获取关注总数失败')
    }
    if (fansCountRes.data.code !== 200) {
      console.error('获取粉丝总数失败:', fansCountRes.data.message)
      ElMessage.error('获取粉丝总数失败')
    }

    const backendUserInfo = userInfoRes.data.data as UserInfo
    userInfo.value = {
      avatar: `${BASE_MINIO_URL}/avatar/${backendUserInfo.avatar}`,
      name: backendUserInfo.nickname,
    }
    stats.value = {
      follow: followCountRes.data.data,
      fan: fansCountRes.data.data
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('注册失败:', error.response.data.message)
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
    } else {
      console.error('请求失败: 未知错误')
    }
  }
}

const formattedStats = computed(() => ({
  follow: stats.value.follow.toLocaleString(),
  fan: stats.value.fan.toLocaleString(),
}))
</script>

<style scoped>
/* 头部背景区域 */
.profile-header {
  position: relative;
  width: 100%;
  height: 200px;
  /* 根据需求调整高度 */
  overflow: hidden;
  margin-bottom: 20px;
  /* 与下方内容的间距 */
}

/* 背景图片样式 */
.header-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(../assets/account_top.png);
  background-size: cover;
  background-position: center;
  filter: brightness(0.8);
  /* 可选：降低亮度使文字更清晰 */
}

/* 用户信息区域 */
.profile-info {
  position: relative;
  /* 确保在背景之上 */
  display: flex;
  align-items: center;
  padding: 20px 0 20px 100px;
  /* 上 右 下 左 - 左边距60px */
  height: 100%;
  max-width: 100%;
  /* 限制内容宽度 */
  margin: 0 auto;
  /* 居中 */
}

/* 头像样式 */
.user-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  margin-right: 20px;
  /* 头像与名字的间距 */
}

/* 用户名样式 */
.user-name {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

/* 固定导航菜单容器 */
.homePage-sticky-menu-container {
  position: sticky;
  top: 0;
  z-index: 1000;
  /* 确保菜单在最上层 */
  background-color: white;
  /* 菜单背景色 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  /* 滚动时添加阴影 */
}

/* 垂直排列菜单项 */
.vertical-menu-item {
  height: auto !important;
  padding: 8px 15px !important;
}

.vertical-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-top: 2px;
}

.left-menus {
  display: flex;
  align-items: center;
  gap: 20px;
  /* 调整菜单间距 */
  min-width: 200px;
  /* 确保左侧菜单不被折叠 */
}

.header-menu {
  display: flex;
  justify-content: space-between;
  /* 左右对齐 */
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
  border-right: none;
}

.right-menus {
  display: flex;
  align-items: center;
  gap: 20px;
  overflow: hidden;
  /* 防止内容溢出 */
}

/* 移除菜单项的默认下划线 */
.el-menu--horizontal>.el-menu-item {
  border-bottom: none !important;
}
</style>

```
