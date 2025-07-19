export interface RegisterUserRequest {
  phone: string
  email: string
  password: string
}

export interface LoginUserRequest {
  phone: string
  password: string
}

// 更新用户信息
export interface updateUserInfoRequest {
  nickname: string
  gender: string
  birthday: string
  sign: string
  announcement: string
  avatar: string
  coin: number
}

// 用户关注其他用户
export interface UserFollowRequest {
  userId: number
  followId:number
  groupId:number
  createAt: string
}

// 创建关注分组
export interface CreateFollowGroupRequest {
  userId: number
  name:string
}
