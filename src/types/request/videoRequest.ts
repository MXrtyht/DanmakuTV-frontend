import type {VideoTag} from '@/types/entity/video'

// 获取用户所有视频
export interface GetUserAllVideoRequest{
  page:number
  size:number
}

// 上传视频
export interface UploadVideoRequest {
  userId:number
  videoUrl:string
  coverUrl:string
  title:string
  type:boolean
  duration:number
  area:number
  tags: VideoTag[]
}

// 查询所有视频
export interface GetAllVideoRequest {
  page:number
  size:number
}
