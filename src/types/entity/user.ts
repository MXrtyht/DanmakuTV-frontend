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

export interface UserProfile {
  id: number
  userId: number
  nickname: string
  gender: string
  birthday: string
  sign: string
  announcement: string
  avatar: string
  coin: number
  createAt: string
  updateAt: string
}

// 前端用的UserCard信息
export interface UserCardInfo {
  id: number
  name: string
  signature: string
  avatar: string
}
