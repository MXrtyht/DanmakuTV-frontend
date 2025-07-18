```
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

      <!-- 右侧空白占位 -->
      <div class="menu-spacer"></div>

      <!-- 垂直排列的统计项 -->
      <el-menu-item index="/home/follow" class="vertical-menu-item">
        <div class="vertical-stats">
          <div class="stat-label">关注者</div>
          <div class="stat-value">1,234</div>
        </div>
      </el-menu-item>

      <el-menu-item index="/home/fan" class="vertical-menu-item">
        <div class="vertical-stats">
          <div class="stat-label">粉丝数</div>
          <div class="stat-value">5,678</div>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute() // 动态计算激活菜单
const activeMenu = computed(() => {
  return route.path // 直接使用当前路由路径 // 或者处理嵌套路由： // return '/' + route.path.split('/')[1]
  })
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

