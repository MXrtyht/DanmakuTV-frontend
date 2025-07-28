<template>
  <el-container class="main-container">
    <!-- 使用抽离的侧边栏组件 -->
    <GroupSidebar
      :group-list="buttonList"
      :active-group-index="activeButtonIndex"
      placeholder="输入关注分组名称"
      @add-group="addButton"
      @remove-group="removeButton"
      @select-group="selectButton"
    />

    <!-- 右侧用户列表 -->
    <el-main class="right-content">
      <div
        v-if="userList === null || userList === undefined || userList.length === 0"
        class="empty-state"
      >
        <el-empty description="当前分组暂无关注用户" />
      </div>
      <el-row
        v-else
        :gutter="16"
      >
        <el-col
          v-for="user in userList"
          :key="user.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <UserCard
            :user="user"
            :is-followed="true"
            default-text="已关注"
            second-text="关注"
            class="grid-item"
            @follow-change="handleFollowChange"
          />
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import GroupSidebar from '@/components/GroupSidebar/GroupSidebar.vue'
import UserCard from '@/components/userCard/UserCard.vue'
import type { UserCardInfo, UserProfile } from '@/types/entity/user'
import type { UserUnfollowRequest } from '@/types/request/userRequest'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const BASE_SERVER_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API

onMounted(() => {
  loadData()
})

// 修改接口定义，兼容 GroupSidebar 组件
interface ButtonItem {
  id: number        // 添加 id 字段
  name: string
  groupId: number | null
  userId?: number | null  // 添加 userId 字段用于默认分组判断
}

const userLists = reactive<UserCardInfo[][]>([])
const userList = ref<UserCardInfo[]>()

// 修改 buttonList 的类型
const buttonList = ref<ButtonItem[]>([])
const activeButtonIndex = ref<number | null>(null)

const loadData = async () => {
  try {
    // 1. 先获取关注分组列表
    await loadFollowGroups()

    // 2. 如果有分组，加载第一个分组的用户
    if (buttonList.value.length > 0) {
      activeButtonIndex.value = 0
      await loadGroupUsers(buttonList.value[0].groupId || 1)
    }

  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

// 获取关注分组列表
const loadFollowGroups = async () => {
  try {
    const response = await request.get(`${BASE_SERVER_URL}/user/follow-groups`)
    const data = response.data

    if (data.code !== 200 || !data.data) {
      ElMessage.error(data.message || '获取关注分组失败')
      return
    }

    // 清空之前的数据
    buttonList.value.length = 0
    userLists.length = 0

    // 构建分组列表
    for (const group of data.data) {
      const buttonItem: ButtonItem = {
        id: group.id,
        name: group.name,
        groupId: group.id,
        userId: group.id === 1 ? null : group.userId
      }
      buttonList.value.push(buttonItem)

      // 为每个分组初始化一个空的用户列表
      userLists.push([])
    }

  } catch (error) {
    console.error('获取关注分组失败:', error)
    ElMessage.error('获取关注分组失败')
  }
}

// 获取指定分组的用户列表
const loadGroupUsers = async (groupId: number) => {
  try {
    const response = await request.get(`${BASE_SERVER_URL}/user/follow-group-users`, {
      params: { groupId }
    })

    if (response.data.code !== 200) {
      console.error('获取分组用户失败:', response.data.message)
      return
    }

    // 将用户数据转换为前端格式
    const userProfiles: UserCardInfo[] = (response.data.data || []).map((profile: UserProfile) => ({
      id: profile.userId,
      name: profile.nickname,
      signature: profile.sign,
      avatar: profile.avatar && profile.avatar !== 'null'
        ? `${BASE_MINIO_URL}/avatar/${profile.avatar}`
        : ''
    }))

    // 找到对应分组的索引并更新用户列表
    const groupIndex = buttonList.value.findIndex(item => item.groupId === groupId)
    if (groupIndex !== -1) {
      userLists[groupIndex] = userProfiles

      // 如果是当前选中的分组，更新显示
      if (activeButtonIndex.value === groupIndex) {
        userList.value = userProfiles
      }
    }

  } catch (error) {
    console.error('获取分组用户失败:', error)
  }
}

// 修改 addButton 函数名和参数
const addButton = async (groupName: string) => {
  try {
    // 调用后端API创建新分组
    const response = await request.post(`${BASE_SERVER_URL}/user/follow-group`, {
      userId: 0, // 随便传个数字，后端会校验替换
      name: groupName
    })

    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '创建分组失败')
      return
    }

    ElMessage.success('分组创建成功')

    // 重新加载分组列表
    await loadFollowGroups()

    // 选中新创建的分组（通常是最后一个）
    if (buttonList.value.length > 0) {
      const newGroupIndex = buttonList.value.length - 1
      await selectButton(newGroupIndex)
    }

  } catch (error) {
    console.error('创建分组失败:', error)
    ElMessage.error('创建分组失败')
  }
}

const removeButton = async (index: number) => {
  try {
    // 获取要删除的分组信息
    const buttonToDelete = buttonList.value[index]
    console.log(buttonToDelete.groupId)
    if (!buttonToDelete || buttonToDelete.groupId === 1) {
      ElMessage.error('无法删除默认分组')
      return
    }

    // 调用后端API删除分组
    const response = await request.post(`${BASE_SERVER_URL}/user/delete-follow-group`, buttonToDelete.groupId, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '删除分组失败')
      return
    }

    // API调用成功后，更新本地状态
    buttonList.value.splice(index, 1)
    userLists.splice(index, 1)

    // 处理活动索引
    if (activeButtonIndex.value === index) {
      // 如果删除的是当前选中的分组，选中第一个分组
      if (buttonList.value.length > 0) {
        await selectButton(0)
      } else {
        activeButtonIndex.value = null
        userList.value = []
      }
    } else if (activeButtonIndex.value !== null && activeButtonIndex.value > index) {
      // 如果删除的分组在当前选中分组之前，调整索引
      activeButtonIndex.value -= 1
    }

    ElMessage.success('删除分组成功')

  } catch (error) {
    console.error('删除分组失败:', error)
    ElMessage.error('删除分组失败')
  }
}

// 点击左侧按钮
const selectButton = async (index: number) => {
  activeButtonIndex.value = index
  const selectedGroup = buttonList.value[index]

  if (selectedGroup) {
    // 先显示已缓存的数据（如果有）
    userList.value = userLists[index] || []

    // 重新加载该分组的最新数据
    await loadGroupUsers(selectedGroup.groupId || 1)

    console.log(`选中分组: ${selectedGroup.name}`)
  }
}

// 关注按钮点击
const handleFollowChange = async ({ newState, userId, onFailure }: { newState: boolean, userId: number, onFailure: () => void }) => {
  console.log('状态变化:', newState)

  if (!newState) {
    // 取关操作 - 直接执行
    await executeUnfollow(userId, onFailure);
  } else {
    // 这里理论上不会执行，因为在关注页面用户已经被关注了
    console.warn('在关注页面尝试关注用户，这不应该发生');
  }
}

// 执行取关操作
const executeUnfollow = async (userId: number, onFailure: () => void) => {
  try {
    const requestBody: UserUnfollowRequest = {
      userId: 0,
      followId: userId,
      groupId: getCurrentGroupId()
    };

    const response = await request.post(`${BASE_SERVER_URL}/user/unfollow`, requestBody);

    if (response.data.code !== 200) {
      ElMessage.error(response.data.message || '取消关注失败');
      onFailure();
      return;
    }

    ElMessage.success('取消关注成功');

    // 重新加载当前分组的用户数据
    if (activeButtonIndex.value !== null) {
      const currentGroupId = getCurrentGroupId()
      await loadGroupUsers(currentGroupId)
    }

  } catch (error) {
    console.error('取消关注失败:', error);
    onFailure();
    ElMessage.error('取消关注失败');
  }
}

// 获取关注的用户当前所在的组
const getCurrentGroupId = (): number => {
  if (activeButtonIndex.value !== null && buttonList.value[activeButtonIndex.value]) {
    return buttonList.value[activeButtonIndex.value].groupId || 1
  }
  return 1 // 默认分组
}
</script>

<style scoped>
.main-container {
  height: 100vh;
  background-color: #f5f5f5;
}

/* 删除以下样式（已经移到 GroupSidebar 组件中）：
.left-sidebar { ... }
.add-button-container { ... }
.button-menu { ... }
.custom-button { ... }
.button-text { ... }
.delete-btn { ... }
*/

.right-content {
  padding: 20px;
  background-color: #fff;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.grid-item {
  margin-bottom: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
}
</style>