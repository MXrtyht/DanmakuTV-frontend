<template>
  <el-aside width="280px" class="group-sidebar">
    <!-- 添加分组输入框 -->
    <div class="add-group-container">
      <el-input
        v-model="newGroupName"
        :placeholder="placeholder"
        class="group-input"
        @keyup.enter="handleAddGroup"
      />
      <el-button
        type="primary"
        @click="handleAddGroup"
        :disabled="!newGroupName.trim()"
      >
        添加分组
      </el-button>
    </div>

    <!-- 分组菜单 -->
    <el-menu
      :default-active="activeGroupIndex?.toString()"
      class="group-menu"
    >
      <el-menu-item
        v-for="(group, index) in groupList"
        :key="index"
        :index="index.toString()"
        class="custom-group"
        @click="handleSelectGroup(index)"
        :class="{ 'active': activeGroupIndex === index }"
      >
        <div class="group-content">
          <span class="group-text">{{ group.name }}</span>
          <div class="group-actions">
            <!-- 默认分组显示标签 -->
            <span v-if="isDefaultGroup(group)" class="default-tag">默认</span>
            <!-- 只有自定义分组才显示删除按钮 -->
            <el-button
              v-else
              class="delete-btn"
              type="danger"
              size="small"
              @click.stop="handleRemoveGroup(index)"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 定义通用的分组类型\
interface GroupItem {
  id: number
  name: string
  userId?: number | null
  groupId?: number | null
}

// Props
interface Props {
  groupList: GroupItem[]
  activeGroupIndex: number | null
  placeholder?: string
}

// Emits
interface Emits {
  (e: 'add-group', name: string): void
  (e: 'remove-group', index: number): void
  (e: 'select-group', index: number): void
}

const { groupList, activeGroupIndex, placeholder = '输入分组名称' } = defineProps<Props>()

const emit = defineEmits<Emits>()

const newGroupName = ref('')

// 修复：判断是否为默认分组的逻辑 - 兼容两种数据结构
const isDefaultGroup = (group: GroupItem): boolean => {
  // 收藏页面：检查 id 为 1 或者 userId 为 null/undefined
  // 关注页面：检查 groupId 为 1
  return group.id === 1 || 
         group.userId === null || 
         group.userId === undefined ||
         group.groupId === 1
}

// 处理添加分组
const handleAddGroup = () => {
  if (newGroupName.value.trim()) {
    emit('add-group', newGroupName.value.trim())
    newGroupName.value = ''
  }
}

// 处理删除分组
const handleRemoveGroup = (index: number) => {
  emit('remove-group', index)
}

// 处理选择分组
const handleSelectGroup = (index: number) => {
  emit('select-group', index)
}
</script>

<style scoped>
.group-sidebar {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 20px;
  overflow-y: auto;
}

.add-group-container {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-input {
  width: 100%;
}

.group-menu {
  border: none;
}

.custom-group {
  display: block !important;
  padding: 0 !important;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
  cursor: pointer;
  transition: all 0.3s;
  height: auto !important;
  line-height: normal !important;
}

.custom-group:hover {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.custom-group.active {
  border-color: #409EFF;
  background-color: #e6f7ff;
}

.group-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  width: 100%;
}

.group-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.group-actions {
  display: flex;
  align-items: center;
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

.delete-btn {
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
}

.custom-group:hover .delete-btn {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .group-sidebar {
    width: 100% !important;
    height: auto;
  }
}
</style>