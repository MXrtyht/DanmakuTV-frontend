export interface VideoTag{
  id:number
  name:string
}

export interface VideoData {
  id: number
  userId: string
  videoUrl: string
  coverUrl: string
  title: string
  type: boolean
  duration: number
  area: number
  tags: VideoTag[]
  createAt: string
  updateAt: string
}

