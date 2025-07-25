import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import type { VideoCountVO } from '@/types/response/videoResponse'

/**
 * 获取视频时长（秒）
 * @param {File} file 视频文件对象
 * @returns {Promise<number>} 视频时长（秒）
 */
export const getVideoDuration = (file:File) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata' // 仅加载元数据，不消耗过多资源

    // 成功获取元数据
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src) // 释放内存
      resolve(video.duration)
    }

    // 处理错误
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('无法解析视频时长'))
    }

    video.src = URL.createObjectURL(file)
  })
}

//批量获取视频播放量
export const getVideoPlayCountBatch= async (videoIdList:number[],url:string)=>{
const videoCountRes=await request.get(url,{
      params: { videoId: videoIdList },
      paramsSerializer: {
        indexes: null // 关键配置
      }
    })
  if(videoCountRes.data.code!==200||!videoCountRes.data.data){
    ElMessage.error("获取播放数量失败")
    console.log("获取播放数量失败:",videoCountRes.data.data)
    return undefined
  }else{
    const videoCount=videoCountRes.data.data as VideoCountVO[]
    const countMap = new Map<number, number>();
    videoCount.forEach(item => {
      countMap.set(item.videoId, item.count);
    });
    return countMap
  }
}
