<template>
    <el-dialog
        v-model="visible"
        :title="title"
        width="450px"
        :before-close="handleCancel"
    >
        <div class="follow-dialog-content">
            <div class="group-selection">
                <div
                    v-for="group in followGroups"
                    :key="group.id"
                    class="group-item"
                    :class="{ 'selected': selectedGroupId === group.id }"
                    @click="selectedGroupId = group.id"
                >
                    <el-radio
                        :model-value="selectedGroupId"
                        :value="group.id"
                        class="group-radio"
                        @change="selectedGroupId = group.id"
                    >
                        <div class="group-content">
                            <span class="group-name">{{ group.name }}</span>
                            <span
                                v-if="group.id === 1"
                                class="default-tag"
                            >默认</span>
                        </div>
                    </el-radio>
                </div>
            </div>

            <div
                v-if="followGroups.length === 0"
                class="empty-state"
            >
                <el-empty description="暂无关注分组，请先创建分组" />
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button
                    type="primary"
                    :loading="loading"
                    :disabled="!selectedGroupId || followGroups.length === 0"
                    @click="handleConfirm"
                >
                    {{ confirmText }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'

interface FollowGroup {
    id: number
    name: string
    userId: number
}

interface Props {
    modelValue: boolean // 控制弹窗显示
    title?: string
    confirmText?: string
    defaultGroupId?: number | null
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', groupId: number): void
    (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
    title: '选择关注分组',
    confirmText: '确认关注',
    defaultGroupId: null
})

const emit = defineEmits<Emits>()

const BASE_USER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API

// 响应式数据
const visible = ref(false)
const followGroups = ref<FollowGroup[]>([])
const selectedGroupId = ref<number | null>(null)
const loading = ref(false)

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
    visible.value = newVal
    if (newVal) {
        loadFollowGroups()
    }
})

// 监听 visible 变化，同步到父组件
watch(visible, (newVal) => {
    emit('update:modelValue', newVal)
})

// 加载关注分组列表
const loadFollowGroups = async () => {
    try {
        loading.value = true

        const response = await request.get(`${BASE_USER_URL}/user/follow-groups`)

        if (response.data.code === 200) {
            followGroups.value = response.data.data || []

            // 设置默认选中的分组
            if (props.defaultGroupId && followGroups.value.some(g => g.id === props.defaultGroupId)) {
                selectedGroupId.value = props.defaultGroupId
            } else if (followGroups.value.length > 0) {
                // 默认选中第一个分组（通常是默认分组）
                selectedGroupId.value = followGroups.value[0].id
            }
        } else {
            throw new Error(response.data.message || '获取关注分组失败')
        }
    } catch (error) {
        console.error('获取关注分组失败:', error)
        ElMessage.error('获取关注分组失败')
        followGroups.value = []
    } finally {
        loading.value = false
    }
}

// 确认选择
const handleConfirm = () => {
    if (!selectedGroupId.value) {
        ElMessage.warning('请选择关注分组')
        return
    }

    emit('confirm', selectedGroupId.value)
    visible.value = false
}

// 取消选择
const handleCancel = () => {
    emit('cancel')
    visible.value = false
    selectedGroupId.value = null
}

// 重置选择
const reset = () => {
    selectedGroupId.value = null
    followGroups.value = []
}

// 暴露方法给父组件
defineExpose({
    reset
})
</script>

<style scoped>
.follow-dialog-content {
    padding: 10px 0;
    max-height: 400px;
    overflow-y: auto;
}

.group-selection {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.group-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color);
    cursor: pointer;
    transition: all 0.3s;
    background: var(--el-fill-color-blank);
}

.group-item:hover {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
}

.group-item.selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
}

.group-radio {
    width: 100%;
    margin: 0;
}

.group-radio .el-radio__input {
    margin-right: 12px;
}

.group-radio .el-radio__label {
    width: 100%;
    padding: 0;
}

.group-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.group-name {
    flex: 1;
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 500;
}

.default-tag {
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid var(--el-color-primary-light-7);
    font-weight: normal;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
}

/* 选中状态的单选框样式 */
.group-item.selected .el-radio__input.is-checked .el-radio__inner {
    background-color: var(--el-color-primary);
    border-color: var(--el-color-primary);
}

.group-item.selected .el-radio__input.is-checked+.el-radio__label {
    color: var(--el-text-color-primary);
}

/* 弹窗整体样式调整 */
:deep(.el-dialog__header) {
    padding: 20px 20px 10px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-dialog__body) {
    padding: 20px;
}

:deep(.el-dialog__footer) {
    padding: 15px 20px 20px 20px;
}

/* 滚动条样式 */
.follow-dialog-content::-webkit-scrollbar {
    width: 6px;
}

.follow-dialog-content::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
}

.follow-dialog-content::-webkit-scrollbar-thumb {
    background: var(--el-border-color-dark);
    border-radius: 3px;
}

.follow-dialog-content::-webkit-scrollbar-thumb:hover {
    background: var(--el-text-color-placeholder);
}

/* 响应式设计 */
@media (max-width: 768px) {
    :deep(.el-dialog) {
        width: 90% !important;
        margin: 0 5%;
    }

    .group-item {
        padding: 16px 12px;
    }

    .group-name {
        font-size: 16px;
    }

    .follow-dialog-content {
        max-height: 300px;
    }
}

/* 点击动画效果 */
.group-item:active {
    transform: scale(0.98);
}
</style>
