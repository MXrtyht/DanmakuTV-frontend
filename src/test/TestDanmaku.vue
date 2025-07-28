<template>
    <div class="video-wrapper">
        <video
            ref="videoRef"
            id="video"
            controls
            :src="videoUrl"
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
                <span 
                    :style="{
                        color: danmu.color || 'white',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontSize: (danmu.fontSize || 16) + 'px',
                        position: 'relative',
                        top: (danmu.offsetY || 0) + 'px'
                    }"
                >
                    {{ danmu.text }}
                </span>
            </template>
        </vue-danmaku>

        <!-- 弹幕发送框 -->
        <div class="danmaku-input">
            <!-- 弹幕开关控制 -->
            <div class="danmaku-toggle-inline">
                <span>弹幕</span>
                <div class="toggle-switch" @click="toggleDanmaku">
                    <div class="toggle-slider" :class="{ active: showDanmaku }"></div>
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
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import vueDanmaku from 'vue-danmaku';

const danmakuRef = ref(null)
const videoRef = ref(null)
const inputDanmu = ref('')
const historyDanmus = ref([]) // 历史弹幕
const realTimeDanmus = ref([]) // 实时弹幕（用于vue-danmaku组件）
const onlineCount = ref(0)
const currentTime = ref(0)
const showDanmaku = ref(true) // 弹幕显示开关

const videoId = 1
const videoUrl = 'http://localhost:8083/upload/video-slice/video/ebc5527e-19bd-4456-9765-e09f4fe29264_女同舍友爱上压抑铁T爱上我.mp4'

// 弹幕颜色池（以白色为主，少量彩色）
const danmakuColors = [
    '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', // 5个白色
    '#FFE4E1', '#F0F8FF', '#F5F5DC', '#FFF8DC', '#F8F8FF', // 浅色系
    '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#FFB6C1'  // 少量彩色
]

// 随机生成弹幕样式
const generateDanmakuStyle = () => {
    return {
        color: danmakuColors[Math.floor(Math.random() * danmakuColors.length)],
        fontSize: Math.random() > 0.8 ? 18 : 16, // 20% 概率大字体
        offsetY: Math.floor(Math.random() * 20) - 10, // -10 到 10 的随机偏移
        speed: 80 + Math.random() * 80 // 80-160 的随机速度
    }
}

// 初始化 WebSocket
let socket: WebSocket
const initWebSocket = () => {
    const token = 'eyJhbGciOiJIUzUxMiIsInppcCI6IkdaSVAifQ.H4sIAAAAAAAA_6tWKi5NUrJSSknMy03MLtUNDXYNUtJRSq0oULIyNDc1NjUxNDO11FEqLU4t8kxRsjKqBQA7ZJ38MgAAAA.Hx_lbnuRh9LIr0G8PuISLVhh_-rpSeaVRkdcWEfqCrJ6X-U2uOYPMsll_tE70M-qrzrxqY0iDCis-LGYw1cvIA'

    socket = new WebSocket(`ws://localhost:8084/wsserver/${token}`)

    socket.onopen = () => {
        console.log('WebSocket 连接成功')
    }

    socket.onmessage = (e) => {
        try {
            const response = JSON.parse(e.data)
            console.log('收到消息:', response)

            // 统一的消息格式处理
            switch (response.type) {
                case 'connection':
                    // 处理连接成功消息
                    console.log('连接成功:', response.message)
                    // 从 data 字符串中提取在线人数
                    if (response.data && typeof response.data === 'string') {
                        const match = response.data.match(/在线人数: (\d+)/)
                        if (match) {
                            onlineCount.value = parseInt(match[1])
                        }
                    }
                    break

                case 'danmaku':
                    // 处理弹幕消息
                    if (response.data) {
                        let danmakuData
                        if (typeof response.data === 'string') {
                            danmakuData = JSON.parse(response.data)
                        } else {
                            danmakuData = response.data
                        }

                        if (danmakuData.content) {
                            const newDanmu = {
                                text: danmakuData.content,
                                time: Date.now(),
                                ...generateDanmakuStyle() // 添加随机样式
                            }

                            // 实时弹幕直接插入显示
                            if (danmakuRef.value && showDanmaku.value) {
                                danmakuRef.value.insert(newDanmu)
                            }
                        }
                    }
                    break

                case 'error':
                    // 处理错误消息
                    console.error('服务器错误:', response.message)
                    break

                default:
                    console.warn('未知消息类型:', response.type)
            }
        } catch (error) {
            console.error('解析 WebSocket 消息失败:', error)
        }
    }

    socket.onerror = (error) => {
        console.error('WebSocket 错误:', error)
    }

    socket.onclose = () => {
        console.log('WebSocket 连接关闭')
        // 可以在这里实现重连逻辑
    }
}

// 加载历史弹幕
const loadDanmakus = async () => {
    try {
        const res = await fetch(`http://localhost:8084/video/danmaku?videoId=${videoId}`)
        const json = await res.json()
        console.log('历史弹幕:', json)

        if (json?.data && Array.isArray(json.data)) {
            // 将历史弹幕按视频时间点排序
            historyDanmus.value = json.data
                .filter(d => d.content && d.content.trim()) // 过滤掉空内容
                .map(d => ({
                    text: d.content,
                    videoTime: d.videoTime || 0, // 视频时间点（Long类型，单位秒）
                    id: d.id,
                    createAt: d.createAt,
                    shown: false, // 标记是否已显示
                    ...generateDanmakuStyle() // 添加随机样式
                }))
                .sort((a, b) => a.videoTime - b.videoTime) // 按视频时间点排序
            
            console.log('处理后的历史弹幕:', historyDanmus.value)
        }
    } catch (error) {
        console.error('加载历史弹幕失败:', error)
    }
}

// 获取视频元数据
const onLoadedMetadata = () => {
    console.log('视频加载完成')
}

// 视频时间更新 - 实现基于时间点的弹幕显示
const onTimeUpdate = () => {
    if (videoRef.value) {
        currentTime.value = videoRef.value.currentTime
        
        // 检查是否有弹幕需要在当前时间点显示
        if (showDanmaku.value) {
            showDanmakuAtTime(Math.floor(currentTime.value))
        }
    }
}

// 在指定时间点显示弹幕
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
            speed: danmu.speed // 添加随机速度
        })
        danmu.shown = true
        console.log(`显示弹幕: ${danmu.text} 在 ${danmu.videoTime}s`)
    })
}

// 视频跳转时重置弹幕状态
const onSeeked = () => {
    // 重置所有弹幕的显示状态
    historyDanmus.value.forEach(danmu => {
        danmu.shown = false
    })
    
    // 清空当前显示的弹幕
    if (danmakuRef.value) {
        danmakuRef.value.stop()
        if (showDanmaku.value) {
            danmakuRef.value.play()
        }
    }
    
    console.log('视频跳转，重置弹幕状态')
}

// 播放时启动弹幕
const onPlay = () => {
    if (danmakuRef.value && showDanmaku.value) {
        danmakuRef.value.play()
        console.log('视频播放，弹幕启动')
    }
}

// 暂停时暂停弹幕
const onPause = () => {
    if (danmakuRef.value) {
        danmakuRef.value.pause()
        console.log('视频暂停，弹幕暂停')
    }
}

// 弹幕开关切换
const toggleDanmaku = () => {
    showDanmaku.value = !showDanmaku.value
    
    if (showDanmaku.value) {
        // 开启弹幕
        if (danmakuRef.value) {
            danmakuRef.value.play()
        }
        console.log('弹幕已开启')
    } else {
        // 关闭弹幕
        if (danmakuRef.value) {
            danmakuRef.value.stop()
        }
        console.log('弹幕已关闭')
    }
}

// 发送弹幕
const sendDanmu = () => {
    if (!inputDanmu.value.trim()) return

    // 1. 立即显示弹幕（先上屏，提升用户体验）
    if (danmakuRef.value && showDanmaku.value) {
        const localDanmu = {
            text: inputDanmu.value.trim(),
            time: Date.now(),
            ...generateDanmakuStyle() // 添加随机样式
        }
        danmakuRef.value.insert(localDanmu)
        console.log('本地弹幕立即显示:', localDanmu)
    }

    // 2. 然后发送到服务器
    if (socket && socket.readyState === WebSocket.OPEN) {
        // 获取当前视频播放时间点（Long类型，单位秒）
        const videoTime = videoRef.value ? Math.floor(videoRef.value.currentTime) : 0
        
        // 构造符合后端要求的消息格式
        const msg = {
            type: "danmaku",
            data: {
                videoId: videoId,
                content: inputDanmu.value.trim(),
                videoTime: videoTime // Long类型，单位秒
            },
            message: "发送弹幕",
            createAt: new Date().toISOString().slice(0, 19) // LocalDateTime格式
        }

        const jsonMessage = JSON.stringify(msg)
        socket.send(jsonMessage)
        console.log('发送弹幕到服务器:', msg)
    } else {
        console.error('WebSocket 连接未建立或已关闭')
    }

    // 3. 清空输入框
    inputDanmu.value = ''
}

// 组件挂载时初始化
onMounted(async () => {
    initWebSocket()
    await loadDanmakus()
})

// 组件卸载时清理
onUnmounted(() => {
    if (socket) {
        socket.close()
    }
})
</script>

<style scoped>
.video-wrapper {
    position: relative;
    width: 800px;
    margin: auto;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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