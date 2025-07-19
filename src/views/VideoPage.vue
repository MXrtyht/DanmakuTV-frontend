<template>
  <div class="video-page">
    <h1>视频详情页</h1>
    <p>当前视频ID: {{ videoId }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const videoId = route.params.videoId
</script>

<style scoped>
.video-page {
  padding: 20px;
}
</style>