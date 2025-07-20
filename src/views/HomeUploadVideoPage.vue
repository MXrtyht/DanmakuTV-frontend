<template>
  <div class="video-upload-page">
    <div class="upload-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>上传视频</h2>
        <p>支持 MP4、AVI、MOV 等格式，文件大小不超过 500MB</p>
      </div>

      <!-- 上传表单 -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="upload-form"
      >
        <!-- 文件上传区域 -->
        <el-form-item label="视频文件" prop="videoFile" required>
          <div class="upload-area">
            <el-upload
              ref="uploadRef"
              class="video-uploader"
              drag
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              :before-upload="beforeUpload"
              accept="video/*"
            >
              <div v-if="!formData.VideoFile" class="upload-dragger-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p>将视频文件拖到此处，或<em>点击上传</em></p>
                  <p class="upload-tip">支持 MP4、AVI、MOV 格式</p>
                </div>
              </div>

              <!-- 已选择文件预览 -->
              <div v-else class="file-preview">
                <div class="file-info">
                  <el-icon class="file-icon"><VideoPlay /></el-icon>
                  <div class="file-details">
                    <div class="file-name">{{ formData.VideoFile?.name || '未上传文件' }}</div>
                    <div class="file-size">{{ formData.VideoFile?formatFileSize(formData.VideoFile.size):'0KB' }}</div>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="removeFile('video')"
                    class="remove-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>

                <!-- 上传进度 -->
                <el-progress
                  v-if="uploadProgress > 0"
                  :percentage="uploadProgress"
                  :status="uploadStatus"
                  class="upload-progress"
                />
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <!-- 封面上传区域 -->
        <el-form-item label="视频封面" required>
          <div class="upload-area">
            <el-upload
              ref="coverUploadRef"
              class="cover-uploader"
              drag
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleCoverChange"
              :before-upload="beforeCoverUpload"
              accept="image/*"
            >
              <div v-if="!formData.coverFile" class="upload-dragger-content cover-upload">
                <el-icon class="upload-icon"><Picture /></el-icon>
                <div class="upload-text">
                  <p>将封面图片拖到此处，或<em>点击上传</em></p>
                  <p class="upload-tip">支持 JPG、PNG 格式，建议尺寸 16:9</p>
                </div>
              </div>

              <!-- 封面预览 -->
              <div v-else class="cover-preview">
                <div class="cover-image-container">
                  <img :src="coverPreviewUrl" alt="封面预览" class="cover-image" />
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="removeFile('cover')"
                    class="cover-remove-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="cover-info">
                  <div class="file-name">{{ formData.coverFile?.name ||'未选择文件'}}</div>
                  <div class="file-size">{{ formData.coverFile? formatFileSize(formData.coverFile.size) : '0 KB' }}</div>
                </div>
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <!-- 视频标题 -->
        <el-form-item label="视频标题" prop="title" required>
          <el-input
            v-model="formData.title"
            placeholder="请输入视频标题"
            maxlength="100"
            show-word-limit
            clearable
          />
        </el-form-item>

        <!-- 视频简介 -->
        <el-form-item label="视频简介" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入视频简介..."
            :rows="4"
            maxlength="500"
            show-word-limit
            resize="none"
          />
        </el-form-item>

        <!-- 视频类型 -->
        <el-form-item label="视频类型" prop="type" required>
          <el-radio-group v-model="formData.type">
            <el-radio label="original">自制</el-radio>
            <el-radio label="reprint">转载</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 视频分区 -->
        <el-form-item label="视频分区" prop="category" required>
          <el-select
            v-model="formData.area"
            placeholder="请选择视频分区"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-form-item>

        <!-- 视频标签 -->
        <!-- Warning: 还没确定 -->
        <el-form-item label="视频标签" required>
          <div class="tags-container">
            <el-tag
              v-for="tag in formData.m_tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>

            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              @blur="handleTagInputConfirm"
              @keyup.enter="handleTagInputConfirm"
              class="tag-input"
            />

            <el-button
              v-else
              size="small"
              @click="showTagInput"
              class="add-tag-btn"
            >
              <el-icon><Plus /></el-icon>
              添加标签
            </el-button>
          </div>
          <div class="tags-tip">最多添加10个标签，每个标签不超过20个字符</div>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item class="form-actions">
          <div class="action-buttons">
            <el-button @click="resetForm">重置</el-button>
            <el-button
              type="primary"
              @click="submitForm"
              :loading="submitting"
              :disabled="!formData.videoUrl || !formData.coverUrl"
            >
              {{ submitting ? '上传中...' : '提交上传' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick,onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UploadFilled,
  VideoPlay,
  Picture,
  Close,
  Plus
} from '@element-plus/icons-vue'
import type { UploadVideoRequest } from '@/types/request/videoRequest'
import type { UploadFile } from 'element-plus'
import axios from 'axios'
import request from '@/utils/request'

/**
 * 目前上传的流程
 * 1. 获取分区、Tag
 * 2. 计算视频时长
 * 3. 上传视频文件、封面文件到服务器，得到视频ID和封面ID
 * 4. 提交视频信息到服务器
*/

// 响应式数据
const formRef = ref()
const uploadRef = ref()
const coverUploadRef = ref()
const tagInputRef = ref()
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const uploadProgress = ref(0)
const uploadStatus = ref('')
const submitting = ref(false)
const coverPreviewUrl = ref('')

const BASE_MINIO_URL = import.meta.env.VITE_MINIO_SERVER_BASE_API;
const BASE_VIDEO_URL = import.meta.env.VITE_VIDEO_SERVICE_BASE_API;

interface MyuploadFile extends UploadVideoRequest {
  VideoFile?:UploadFile
  coverFile?:UploadFile
  m_tags?: string[]
}

// 表单数据
const formData = reactive<MyuploadFile>({
  VideoFile: undefined, // 上传的视频文件
  coverFile: undefined, // 上传的封面文件
  userId: 1, // 这个值可以为任意
  videoUrl: '',
  coverUrl: '',
  title: '',
  description: '',
  duration: 0, // 视频时长，单位秒
  type: true,
  area: 0,
  tags: [],
  m_tags: []
})

// 视频分区选项 临时数据
const categories = [
  { label: '生活', value: 'life' },
  { label: '娱乐', value: 'entertainment' },
  { label: '科技', value: 'tech' },
  { label: '游戏', value: 'gaming' },
  { label: '音乐', value: 'music' },
  { label: '体育', value: 'sports' },
  { label: '教育', value: 'education' },
  { label: '美食', value: 'food' },
  { label: '旅行', value: 'travel' },
  { label: '其他', value: 'other' }
]

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入视频标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择视频类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择视频分区', trigger: 'change' }
  ],
  tags: [
    { required: true, type: 'array', max: 10, message: '最多添加10个标签', trigger: 'change' }
  ]
}

// 方法
const formatFileSize = (bytes:number|undefined) => {
  if (bytes === undefined) return '0 Bytes'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const beforeUpload = (file:UploadFile) => {
  if (file.raw===undefined){
    return false
  }
  const isVideo = file.raw.type.startsWith('video/')
  if(file.size===undefined){
    return false
  }
  const isLt500M = file.size / 1024 / 1024 < 500

  if (!isVideo) {
    ElMessage.error('只能上传视频文件!')
    return false
  }
  if (!isLt500M) {
    ElMessage.error('上传视频大小不能超过 500MB!')
    return false
  }
  return true
}

const handleFileChange = (file:UploadFile) => {
  if (beforeUpload(file)) {
    ElMessage.success('视频文件选择成功!')
  }
}

const beforeCoverUpload = (file:UploadFile) => {
  if (file.raw===undefined){
    return false
  }
  const isImage = file.raw.type.startsWith('image/')
  if(file.size===undefined){
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleCoverChange = (file:UploadFile) => {
  if (beforeCoverUpload(file)&&file.raw!==undefined) {
    // 创建预览URL
    coverPreviewUrl.value = URL.createObjectURL(file.raw)
    ElMessage.success('封面图片选择成功!')
  }
}

const removeFile = (type:string) => {
  if (type === 'video') {
    formData.videoUrl = ''
    uploadProgress.value = 0
    uploadStatus.value = ''
    uploadRef.value.clearFiles()
  } else if (type === 'cover') {
    formData.coverUrl = ''
    if (coverPreviewUrl.value) {
      URL.revokeObjectURL(coverPreviewUrl.value)
      coverPreviewUrl.value = ''
    }
    coverUploadRef.value.clearFiles()
  }
}

const showTagInput = () => {
  if (formData.tags.length >= 10) {
    ElMessage.warning('最多只能添加10个标签')
    return
  }
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value.focus()
  })
}

const handleTagInputConfirm = () => {
  const tag = tagInputValue.value.trim()
  if(formData.m_tags===undefined){
    return
  }
  if (tag && !formData.m_tags.includes(tag)) {
    if (tag.length > 20) {
      ElMessage.warning('标签长度不能超过20个字符')
      return
    }
    formData.m_tags.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag:string) => {
  if(formData.m_tags===undefined){
    return
  }
  const index = formData.m_tags.indexOf(tag)
  if (index > -1) {
    formData.m_tags.splice(index, 1)
  }
}

const resetForm = () => {
  ElMessageBox.confirm('确定要重置表单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    formRef.value.resetFields()
    formData.videoUrl = ''
    formData.coverUrl = ''
    formData.tags = []
    uploadProgress.value = 0
    uploadStatus.value = ''
    uploadRef.value.clearFiles()
    coverUploadRef.value.clearFiles()
    if (coverPreviewUrl.value) {
      URL.revokeObjectURL(coverPreviewUrl.value)
      coverPreviewUrl.value = ''
    }
    ElMessage.success('表单已重置')
  }).catch(() => {})
}

const submitForm = async () => {
  if (!formData.videoUrl) {
    ElMessage.error('请先选择视频文件')
    return
  }

  try {
    await formRef.value.validate()
    submitting.value = true
    // 上传视频封面文件
    const uploadVideoRes=await request.post(`${BASE_MINIO_URL}/video/upload-video`)
    const uploadCoverRes=await request.post(`${BASE_MINIO_URL}/video/upload-cover`)
    if (uploadVideoRes.data.code !== 200||!uploadVideoRes.data.data) {
      console.error('获取视频标签失败:', uploadVideoRes.data.message)
      ElMessage.error('获取视频标签失败')
      return
    }
    if (uploadCoverRes.data.code !== 200||!uploadCoverRes.data.data) {
      console.error('获取视频分区失败:', uploadCoverRes.data.message)
      ElMessage.error('获取视频分区失败')
      return
    }
    // TODO 上传信息到服务器

  } catch (error) {
    console.error('表单验证失败:', error)
    submitting.value = false
    if (axios.isAxiosError(error) && error.response) {
      console.error('获取信息失败:', error.response.data.message)
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
    } else {
      console.error('请求失败: 未知错误')
    }
  }
}

const loadData = async () => {
  try {
    // 获取用户信息
    const videoTags = await request.get(`${BASE_VIDEO_URL}/video/tags`)
    const videoAreas = await request.get(`${BASE_VIDEO_URL}/video/area`)
    // TODO 写入到formData.tag并映射到formData.m_tag
    if (videoTags.data.code !== 200||!videoTags.data.data) {
      console.error('获取视频标签失败:', videoTags.data.message)
      ElMessage.error('获取视频标签失败')
      return
    }
    // TODO 写入到formData.area
    if (videoAreas.data.code !== 200||!videoAreas.data.data) {
      console.error('获取视频分区失败:', videoAreas.data.message)
      ElMessage.error('获取视频分区失败')
      return
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('获取信息失败:', error.response.data.message)
    } else if (error instanceof Error) {
      console.error('请求失败:', error.message)
    } else {
      console.error('请求失败: 未知错误')
    }
  }
}

onMounted(() => {
  // 页面加载时可以执行一些初始化操作
  loadData()
})
</script>

<style scoped>
.video-upload-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.upload-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h2 {
  color: #303133;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  color: #909399;
  font-size: 14px;
}

.upload-form {
  margin-top: 24px;
}

.upload-area {
  width: 100%;
}

.video-uploader {
  width: 100%;
}

.video-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.video-uploader :deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
}

.upload-dragger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  color: #606266;
  margin: 8px 0;
  font-size: 14px;
}

.upload-text em {
  color: #409EFF;
  font-style: normal;
  cursor: pointer;
}

.upload-tip {
  color: #909399 !important;
  font-size: 12px !important;
}

.file-preview {
  padding: 20px;
  width: 100%;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.file-icon {
  font-size: 32px;
  color: #409EFF;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-size {
  font-size: 14px;
  color: #909399;
}

.remove-btn {
  flex-shrink: 0;
}

.upload-progress {
  width: 100%;
}

.cover-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 160px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cover-uploader :deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
}

.cover-upload {
  height: 100%;
  /*将内容往下移动一点点*/
  margin-top: 6px;
}

.cover-preview {
  padding: 16px;
  width: 100%;
}

.cover-image-container {
  position: relative;
  margin-bottom: 12px;
  display: inline-block;
}

.cover-image {
  width: 200px;
  height: 112px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cover-remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.cover-info {
  text-align: center;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.tag-input {
  width: 120px;
}

.add-tag-btn {
  border-style: dashed;
}

.tags-tip {
  font-size: 12px;
  color: #909399;
}

.form-actions {
  margin-top: 32px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-buttons .el-button {
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-upload-page {
    padding: 16px;
  }

  .upload-container {
    padding: 24px 16px;
  }

  .video-uploader :deep(.el-upload-dragger) {
    height: 160px;
  }

  .upload-icon {
    font-size: 36px;
  }

  .action-buttons .el-button {
    min-width: 100px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

.tag-item {
  margin: 0;
}
}
</style>
