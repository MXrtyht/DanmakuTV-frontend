export interface VideoData {
  id: number
  userId: number
  videoUrl: string
  coverUrl: string
  title: string
  type: boolean
  duration: number
  area: number
  tags: string[]
  createAt: string
  updateAt: string
}

export interface VideoVO extends VideoData {
  // 扩展字段
  uploaderName?: string
  uploaderAvatar?: string
  playCount?: number
}

export interface VideoCardInfo {
  video: VideoData
  uploaderName?: string
  uploaderAvatar?: string
  playCount?: number
}
