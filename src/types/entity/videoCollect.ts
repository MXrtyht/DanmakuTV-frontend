export interface VideoCollect {
  id: number;
  userId: number;
  videoId: number;
  groupId: number;
  collectedAt: Date;
}

export interface CollectionGroup {
    id: number;
    userId: number;
    // 分组名称
    name: string; 
    // 分组创建时间
    createAt: Date;
    // 分组更新时间
    updateAt: Date;
}

