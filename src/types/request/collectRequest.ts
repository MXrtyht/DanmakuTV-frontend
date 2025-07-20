export interface AddVideoCollectionRequest{
    // 用户id
    userId: number;
    // 关注的视频id
    videoId: number;
    // 分组id
    groupId: number;
    // 收藏时间
    collectedAt: Date;
}