<template>
  <div class="video-player-container">
    <el-card
      class="video-card"
      shadow="never"
    >
      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="loading-container"
      >
        <el-skeleton
          :rows="5"
          animated
        />
        <div class="loading-text">视频加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="error"
        class="error-container"
      >
        <el-result
          icon="error"
          title="视频加载失败"
          sub-title="请检查网络连接或稍后重试"
        >
          <template #extra>
            <el-button
              type="primary"
              @click="$emit('retry')"
            >
              重新加载
            </el-button>
          </template>
        </el-result>
      </div>

      <!-- 视频播放器 -->
      <div
        v-else
        class="video-wrapper"
      >
        <video
          ref="videoRef"
          controls
          :src="videoStreamUrl"
          @play="onPlay"
          @pause="onPause"
          @timeupdate="onTimeUpdate"
          @seeked="onSeeked"
          @loadedmetadata="onLoadedMetadata"
        ></video>

        <!-- 弹幕层 -->
        <vue-danmaku
          ref="danmakuRef"
          v-model:danmus="realTimeDanmus"
          loop
          :autoplay="false"
          :channels="8"
          :speeds="120"
          :debounce="150"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: showDanmaku ? 'block' : 'none'
          }"
        >
          <template v-slot:danmu="{ index, danmu }">
            <span :style="{
              color: danmu.color || 'white',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              fontSize: (danmu.fontSize || 16) + 'px',
              position: 'relative',
              top: (danmu.offsetY || 0) + 'px'
            }">
              {{ danmu.text }}
            </span>
          </template>
        </vue-danmaku>

        <!-- 弹幕发送框 -->
        <div class="danmaku-input">
          <!-- 弹幕开关控制 -->
          <div class="danmaku-toggle-inline">
            <span>弹幕</span>
            <div
              class="toggle-switch"
              @click="toggleDanmaku"
            >
              <div
                class="toggle-slider"
                :class="{ active: showDanmaku }"
              ></div>
            </div>
          </div>

          <input
            v-model="inputDanmu"
            @keydown.enter="sendDanmu"
            placeholder="发弹幕~"
            maxlength="50"
          />
          <button @click="sendDanmu">发送</button>
        </div>

        <!-- 在线人数显示 -->
        <div class="online-count">
          在线人数: {{ onlineCount }}
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import vueDanmaku from 'vue-danmaku';

const props = defineProps({
  videoStreamUrl: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  videoId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['retry'])

// 视频相关
const videoRef = ref(null)
const currentTime = ref(0)
const isPlaying = ref(false)

// 弹幕相关
const danmakuRef = ref(null)
const inputDanmu = ref('')
const historyDanmus = ref([])
const realTimeDanmus = ref([])
const onlineCount = ref(0)
const showDanmaku = ref(true)

// 弹幕颜色池
const danmakuColors = [
  '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', // 5个白色
  '#FFE4E1', '#F0F8FF', '#F5F5DC', '#FFF8DC', '#F8F8FF', // 浅色系
  '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#FFB6C1'  // 少量彩色
]

// 随机生成弹幕样式
const generateDanmakuStyle = () => {
  return {
    color: danmakuColors[Math.floor(Math.random() * danmakuColors.length)],
    fontSize: Math.random() > 0.8 ? 18 : 16,
    offsetY: Math.floor(Math.random() * 20) - 10,
    speed: 80 + Math.random() * 80
  }
}

// WebSocket 相关
let socket: WebSocket
const initWebSocket = () => {
  const token = localStorage.getItem('user_token') || 'default-token'
  socket = new WebSocket(`ws://localhost:8084/wsserver/${token}`)

  socket.onopen = () => {
    console.log('弹幕 WebSocket 连接成功')
  }

  socket.onmessage = (e) => {
    try {
      const response = JSON.parse(e.data)

      switch (response.type) {
        case 'connection':
          if (response.data && typeof response.data === 'string') {
            const match = response.data.match(/在线人数: (\d+)/)
            if (match) {
              onlineCount.value = parseInt(match[1])
            }
          }
          break

        case 'danmaku':
          if (response.data) {
            const danmakuData = typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data

            if (danmakuData.content) {
              const newDanmu = {
                text: danmakuData.content,
                time: Date.now(),
                ...generateDanmakuStyle()
              }

              if (danmakuRef.value && showDanmaku.value) {
                danmakuRef.value.insert(newDanmu)
              }
            }
          }
          break
      }
    } catch (error) {
      console.error('解析弹幕消息失败:', error)
    }
  }

  socket.onerror = (error) => {
    console.error('弹幕 WebSocket 错误:', error)
  }

  socket.onclose = () => {
    console.log('弹幕 WebSocket 连接关闭')
  }
}

// 加载历史弹幕
const loadDanmakus = async () => {
  try {
    const res = await fetch(`http://localhost:8084/video/danmaku?videoId=${props.videoId}`)
    const json = await res.json()

    if (json?.data && Array.isArray(json.data)) {
      historyDanmus.value = json.data
        .filter(d => d.content && d.content.trim())
        .map(d => ({
          text: d.content,
          videoTime: d.videoTime || 0,
          id: d.id,
          createAt: d.createAt,
          shown: false,
          ...generateDanmakuStyle()
        }))
        .sort((a, b) => a.videoTime - b.videoTime)
    }
  } catch (error) {
    console.error('加载历史弹幕失败:', error)
  }
}

// 视频事件处理
const onLoadedMetadata = () => {
  console.log('视频加载完成')
}

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime

    if (showDanmaku.value) {
      showDanmakuAtTime(Math.floor(currentTime.value))
    }
  }
}

const onPlay = () => {
  isPlaying.value = true
  if (danmakuRef.value && showDanmaku.value) {
    danmakuRef.value.play()
  }
}

const onPause = () => {
  isPlaying.value = false
  if (danmakuRef.value) {
    danmakuRef.value.pause()
  }
}

const onSeeked = () => {
  // 重置弹幕状态
  historyDanmus.value.forEach(danmu => {
    danmu.shown = false
  })

  if (danmakuRef.value) {
    danmakuRef.value.stop()
    if (showDanmaku.value && isPlaying.value) {
      danmakuRef.value.play()
    }
  }
}

// 弹幕功能
const showDanmakuAtTime = (currentSecond) => {
  if (!historyDanmus.value || !danmakuRef.value) return

  const currentDanmus = historyDanmus.value.filter(danmu => {
    return danmu.videoTime === currentSecond && !danmu.shown
  })

  currentDanmus.forEach(danmu => {
    danmakuRef.value.insert({
      text: danmu.text,
      time: Date.now(),
      color: danmu.color,
      fontSize: danmu.fontSize,
      offsetY: danmu.offsetY,
      speed: danmu.speed
    })
    danmu.shown = true
  })
}

const toggleDanmaku = () => {
  showDanmaku.value = !showDanmaku.value

  if (showDanmaku.value && isPlaying.value) {
    danmakuRef.value?.play()
  } else {
    danmakuRef.value?.stop()
  }
}

const sendDanmu = () => {
  if (!inputDanmu.value.trim()) return

  // 立即显示
  if (danmakuRef.value && showDanmaku.value) {
    const localDanmu = {
      text: inputDanmu.value.trim(),
      time: Date.now(),
      ...generateDanmakuStyle()
    }
    danmakuRef.value.insert(localDanmu)
  }

  // 发送到服务器
  if (socket && socket.readyState === WebSocket.OPEN) {
    const msg = {
      type: "danmaku",
      data: {
        videoId: props.videoId,
        content: inputDanmu.value.trim(),
        videoTime: Math.floor(currentTime.value)
      },
      message: "发送弹幕",
      createAt: new Date().toISOString().slice(0, 19)
    }

    socket.send(JSON.stringify(msg))
  }

  inputDanmu.value = ''
}

// 监听 videoId 变化，重新加载弹幕
watch(() => props.videoId, () => {
  if (props.videoId) {
    loadDanmakus()
  }
})

onMounted(() => {
  initWebSocket()
  if (props.videoId) {
    loadDanmakus()
  }
})

onUnmounted(() => {
  if (socket) {
    socket.close()
  }
})
</script>

<style scoped>
.video-player-container {
  margin-bottom: 20px;
}

.video-card {
  border-radius: 12px;
  overflow: hidden;
}

.loading-container {
  padding: 40px;
  text-align: center;
}

.loading-text {
  margin-top: 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.error-container {
  padding: 20px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  background: #000;
}

video {
  width: 100%;
  height: 450px;
  background: black;
  display: block;
}

.danmaku-input {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #f5f5f5;
  align-items: center;
}

.danmaku-toggle-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.danmaku-input input {
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
}

.danmaku-input input:focus {
  border-color: #409eff;
}

.danmaku-input button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.danmaku-input button:hover {
  background: #337ecc;
}

.online-count {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.toggle-switch {
  position: relative;
  width: 32px;
  height: 16px;
  background: #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch:hover {
  background: #bbb;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-slider.active {
  transform: translateX(16px);
}

.toggle-switch:has(.toggle-slider.active) {
  background: #409eff;
}
</style>