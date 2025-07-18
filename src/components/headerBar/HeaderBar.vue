<script setup lang="ts">
defineOptions({ name: 'HeaderBar'});
import Logo from '../../assets/Logo.png';
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const searchQuery = ref('')

const handleSearch = () => {
  console.log('搜索内容:', searchQuery.value)
}

</script>
<template>
  <el-container style="height: 100vh;">
    <el-header height="60px" class="fixed-header">
      <el-row type="flex" justify="space-between" align="middle">
        <!-- 左侧Logo -->
        <el-col :span="4">
          <el-image style="width: 174px; height: 94px" :src="Logo" />
        </el-col>

        <!-- 中间空白区域 + 搜索框 -->
        <el-col :span="16">
          <div class="search-area">
            <el-input
              v-model="searchQuery"
              placeholder="搜索视频、用户、标签..."
              class="search-input"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <!-- 右侧导航项 -->
            <!-- TODO 添加跳转-->
            <div class="nav-items">
              <span class="nav-item">个人</span>
              <span class="nav-item">消息</span>
              <span class="nav-item">动态</span>
              <span class="nav-item">收藏</span>
              <span class="nav-item">历史</span>
              <span class="nav-item">创作中心</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-header>

    <el-main style="margin-top: 60px;">
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.fixed-header {
  position: fixed;
  width: 100%;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-area {
  display: flex;
  justify-content: flex-end; /* 整体右对齐 */
  align-items: center;
  gap: 20px; /* 搜索框和导航项的间距 */
  width: 100%;
  height: 100%;
}

.search-input {
  width: 400px; /* 固定搜索框宽度 */
  margin-left: auto; /* 将搜索框推到右侧 */
}

.nav-items {
  margin-right: 30px;
  display: flex;
  gap: 15px;
}

.nav-item {
  cursor: pointer;
  transition: color 0.3s;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--el-color-primary);
}
</style>
