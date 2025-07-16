<script setup lang="ts">
  import { ref } from 'vue'

  const count = ref(0)

  function increment(){
    count.value++
  }
</script>

<template>
  <div>测试</div>
  <button @click="increment">点击了 {{ count }} 次数</button>
</template>

<style scoped>

</style>
