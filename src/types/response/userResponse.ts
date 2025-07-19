import type {UserProfile,UserInfo} from '@/types/entity/user'


export interface UserProfileResponse {
  code:number
  message:string
  data: UserProfile|null
}

// 获取用户信息
export interface UserInfoResponse {
  code:number
  message:string
  data: UserInfo|null
}

// 获取用户关注信息
export interface UserFollowResponse{
  code:number
  message:string
  data:{
    id:number
    userId:number
    name:string
    createAt:string
    updateAt:string
    userProfilesList: UserProfile[]
  }[]|null
}

// 获取用户关注分组
export interface UserFollowGroupResponse {
  code:number
  message:string
  data:{
    id:number
    userId:number
    name:string
    createAt:string
    updateAt:string
  }[]|null
}
