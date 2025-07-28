import type {VideoData} from '@/types/entity/video'
import type {IPage} from '@/types/api/iPage'

// 获取所有或某个用户所有视频
export interface AllVideoResponse {
  code:number
  message:string
  data:IPage<VideoData>| null
}


export interface VideoCountVO{
  videoId:number
  count:number
}
