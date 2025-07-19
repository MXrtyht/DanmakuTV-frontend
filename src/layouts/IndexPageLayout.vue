<template>
  <div class="index">
    <!-- 使用 IndexHeader 组件 -->
    <IndexHeader />

    <!-- 主内容区域 -->
    <el-main class="content">
      <router-view />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import IndexHeader from '../components/headerBar/HeaderBar.vue'
</script>

<style scoped>
.index {
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

/* 主内容区域 */
.content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content {
    padding: 10px;
  }
}
</style>