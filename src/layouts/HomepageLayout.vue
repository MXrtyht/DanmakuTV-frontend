<template>
  <div class="home">
    <el-menu
      mode="horizontal"
      background-color="transparent"
      active-text-color="#409EFF"
      class="header-menu"
      :router="true"
      :default-active="activeMenu"
    >
      <!-- 左侧导航项 -->
      <el-menu-item index="/home/home">主页</el-menu-item>
      <el-menu-item index="/home/home">动态</el-menu-item>
      <el-menu-item index="/home/home">投稿</el-menu-item>
      <el-menu-item index="/home/home">收藏</el-menu-item>
      <el-menu-item index="/home/edit">设置</el-menu-item>

      <!-- 右侧空白占位 -->
      <div class="menu-spacer"></div>

      <!-- 垂直排列的统计项 -->
      <el-menu-item index="/home/follow" class="vertical-menu-item">
        <div class="vertical-stats">
          <div class="stat-label">关注者</div>
          <div class="stat-value">{{ formattedStats.follow }}</div>
        </div>
      </el-menu-item>

      <el-menu-item index="/home/fan" class="vertical-menu-item">
        <div class="vertical-stats">
          <div class="stat-label">粉丝数</div>
          <div class="stat-value">{{ formattedStats.fan }}</div>
        </div>
      </el-menu-item>
    </el-menu>
      <main class="content">
        <router-view /> <!-- 子路由内容在此展示 -->
      </main>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomepageLayout' });
import { onMounted,computed,ref } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;

// 菜单跳转
const route = useRoute() // 动态计算激活菜单
const activeMenu = computed(() => {
  return route.path // 直接使用当前路由路径 // 或者处理嵌套路由： // return '/' + route.path.split('/')[1]
  })

// 获取关注者和粉丝数
onMounted(() => {
  loadData()
})

const stats = ref({
  follow: 0, // 关注者
  fan: 0 // 粉丝数
})


const loadData = async () => {
  try{
    // 获取关注列表
    const response = await request.get(`${BASE_SERVER_URL}/user/fans`);
    const data = response.data;
    if(data.code !== 200){
      console.error('获取粉丝数和关注数失败:', data.message);
      ElMessage.error('获取粉丝数和关注数失败');
      return;
    }
    // TODO补上调用API获取关注者和粉丝数的逻辑
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

const formattedStats = computed(() => ({
  follow: stats.value.follow.toLocaleString(),
  fan: stats.value.fan.toLocaleString()
}))
</script>


<style scoped>
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

/* 保持原有布局的其他样式 */
.header-menu {
  display: flex;
  border-bottom: 1px solid #eee;
  border-right: none;
  padding: 0 20px;
}

.menu-spacer {
  flex-grow: 0.95;
}

/* 移除菜单项的默认下划线 */
.el-menu--horizontal > .el-menu-item {
  border-bottom: none !important;
}
</style>

```

