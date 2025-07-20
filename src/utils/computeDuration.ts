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
