import type {VideoData} from '@/types/entity/video'

// 获取所有或某个用户所有视频
export interface GetAllVideoResponse {
  code:number
  message:string
  data:{
    size:number
    records: VideoData[]
    current:number
    total:number
    pages:number
  } | null
}
