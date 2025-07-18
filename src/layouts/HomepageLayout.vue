<!-- src/layouts/Layout.vue -->
<template>
  <div class="layout">
    <header class="topbar">
      <div>我是固定顶栏</div>
    </header>
    <main class="content">
      <router-view /> <!-- 子路由内容在此展示 -->
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.topbar {
  height: 60px;
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}
.content {
  flex: 1;
  overflow: auto;
}
</style>
