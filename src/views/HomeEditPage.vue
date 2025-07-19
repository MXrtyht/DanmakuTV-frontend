<script setup lang='ts'>
import request from '@/utils/request'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_BASE_API
const MINIO_SERVICE_URL = import.meta.env.VITE_MINIO_SERVICE_BASE_API
const FILE_BASE_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API

// 性别枚举
enum GenderType {
    FEMALE = 0,
    MALE = 1,
    UNKNOWN = 2
}

// 表单数据
interface UserProfileForm {
    nickname: string
    gender: GenderType
    birthday: string
    sign: string
    announcement: string
    avatar: string
    coin: number
}

const formRef = ref<FormInstance>()
const loading = ref(false)
const avatarUploading = ref(false)

const form = reactive<UserProfileForm>({
    nickname: '',
    gender: GenderType.UNKNOWN,
    birthday: '',
    sign: '',
    announcement: '',
    avatar: '',
    coin: 0
})

// 表单验证规则
const rules = reactive<FormRules<UserProfileForm>>({
    nickname: [
        { required: true, message: '请输入昵称', trigger: 'blur' },
        { min: 1, max: 20, message: '昵称长度应在1-20个字符', trigger: 'blur' }
    ],
    sign: [
        { max: 100, message: '个性签名不能超过100个字符', trigger: 'blur' }
    ],
    announcement: [
        { max: 200, message: '主页公告不能超过200个字符', trigger: 'blur' }
    ]
})

// 性别选项
const genderOptions = [
    { label: '女', value: GenderType.FEMALE },
    { label: '男', value: GenderType.MALE },
    { label: '保密', value: GenderType.UNKNOWN }
]

// 获取头像完整URL
const getAvatarUrl = (avatar: string) => {
    if (!avatar) return ''
    return `${FILE_BASE_URL}/avatar/${avatar}`
}

// 头像上传前的校验
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
    const isImage = rawFile.type.startsWith('image/')
    const isLt2M = rawFile.size / 1024 / 1024 < 2

    if (!isImage) {
        ElMessage.error('头像只能是图片格式!')
        return false
    }
    if (!isLt2M) {
        ElMessage.error('头像大小不能超过 2MB!')
        return false
    }
    return true
}

interface uploadOptions {
    file: File
}

// 自定义上传
const customUpload = async (options: uploadOptions) => {
    avatarUploading.value = true

    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('bucketName', 'avatar')

    try {
        const response = await request.post(`${MINIO_SERVICE_URL}/upload/single`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        if (response.data) {
            form.avatar = response.data
            ElMessage.success('头像上传成功')
        }
    } catch (error) {
        console.error('上传失败:', error)
    } finally {
        avatarUploading.value = false
    }
}

// 提交表单
const submitForm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    const valid = await formEl.validate()
    if (!valid) return

    loading.value = true

    try {
        const updateData = {
            nickname: form.nickname,
            gender: form.gender,
            birthday: form.birthday || null,
            sign: form.sign,
            announcement: form.announcement,
            avatar: form.avatar,
            coin: form.coin
        }

        await request.post(`${USER_SERVICE_URL}/user/info`, updateData)

        ElMessage.success('个人信息更新成功')
    } catch (error) {
        console.error('更新失败:', error)
    } finally {
        loading.value = false
    }
}

// 重置表单
const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return

    ElMessageBox.confirm('确定要重置表单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        formEl.resetFields()
        ElMessage.success('表单已重置')
    })
}

// 加载用户信息
const loadUserInfo = async () => {
    try {
        // 获取用户信息
        const response = await request.get(`${USER_SERVICE_URL}/user/info`)
        Object.assign(form, response.data)
    } catch (error) {
        console.error('加载用户信息失败:', error)
    }
}

onMounted(() => {
    loadUserInfo()
})
</script>

<template>
    <div class="edit-page">
        <el-container>
            <el-main>
                <el-card class="edit-card">
                    <template #header>
                        <div class="card-header">
                            <span>编辑个人信息</span>
                        </div>
                    </template>

                    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="left">
                        <!-- 头像上传 -->
                        <el-form-item label="头像" prop="avatar">
                            <el-upload class="avatar-uploader" :http-request="customUpload"
                                :before-upload="beforeAvatarUpload" :show-file-list="false" accept="image/*">
                                <el-image v-if="form.avatar" :src="getAvatarUrl(form.avatar)" class="avatar"
                                    fit="cover" />
                                <el-icon v-else class="avatar-uploader-icon">
                                    <Plus />
                                </el-icon>
                                <div v-if="avatarUploading" class="avatar-uploading">
                                    <el-loading-icon />
                                </div>
                            </el-upload>
                            <div class="upload-tip">
                                <el-text size="small" type="info">
                                    只能上传jpg/png文件，且不超过2MB
                                </el-text>
                            </div>
                        </el-form-item>

                        <!-- 昵称 -->
                        <el-form-item label="昵称" prop="nickname">
                            <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="20" show-word-limit />
                        </el-form-item>

                        <!-- 性别 -->
                        <el-form-item label="性别" prop="gender">
                            <el-radio-group v-model="form.gender">
                                <el-radio v-for="option in genderOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>

                        <!-- 生日 -->
                        <el-form-item label="生日" prop="birthday">
                            <el-date-picker v-model="form.birthday" type="date" placeholder="选择生日" format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD" />
                        </el-form-item>

                        <!-- 个性签名 -->
                        <el-form-item label="个性签名" prop="sign">
                            <el-input v-model="form.sign" type="textarea" placeholder="请输入个性签名" :rows="3"
                                maxlength="100" show-word-limit />
                        </el-form-item>

                        <!-- 主页公告 -->
                        <el-form-item label="主页公告" prop="announcement">
                            <el-input v-model="form.announcement" type="textarea" placeholder="请输入主页公告" :rows="4"
                                maxlength="200" show-word-limit />
                        </el-form-item>

                        <!-- 硬币数量（只读显示） -->
                        <el-form-item label="硬币数量">
                            <el-input-number v-model="form.coin" :min="0" disabled controls-position="right" />
                        </el-form-item>

                        <!-- 操作按钮 -->
                        <el-form-item>
                            <el-space>
                                <el-button type="primary" :loading="loading" @click="submitForm(formRef)">
                                    保存修改
                                </el-button>
                                <el-button @click="resetForm(formRef)">
                                    重置
                                </el-button>
                            </el-space>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-main>
        </el-container>
    </div>
</template>

<style scoped>
.edit-page {
    background-color: #f5f5f5;
    min-height: 100vh;
}

.edit-card {
    width: 70%;
    margin: 0 auto;
}

.card-header {
    font-size: 18px;
    font-weight: 600;
}

.avatar-uploader {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
}

.avatar-uploader:hover {
    border-color: #409eff;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    text-align: center;
    line-height: 100px;
}

.avatar {
    width: 100px;
    height: 100px;
    display: block;
}

.avatar-uploading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #409eff;
}

.upload-tip {
    margin-top: 8px;
    margin-left: 8px;
}
</style>
