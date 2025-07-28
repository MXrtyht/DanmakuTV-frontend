export interface UserInfo{
  userId: number
  nickname: string
  gender: string
  birthday: string
  sign: string
  announcement: string
  avatar: string
  coin: number
}

export interface UserProfile extends UserInfo {
  id: number
  createAt: string
  updateAt: string
}

// 前端用的UserCard信息
export interface UserCardInfo {
  id: number
  name: string
  signature: string
  avatar: string
  isFollowing: boolean
}

// 前端用用户动态数据对象
export interface UserMoment {
  id: number
  video: {
    videoId: number
    title: string
    description: string
    cover: string
  }
  time: Date
}
