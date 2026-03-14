export const COLLECTIONS = {
  users: "users",
  sessions: "sessions",
  videoCards: "video_cards",
  imageCards: "image_cards",
  imageAssets: "image_assets",
  authCodes: "auth_codes", // 授权码记录
  conversations: "conversations", // 对话集合
  usageStats: "usage_stats", // 模型使用统计
};

// GridFS Bucket 名称
export const GRIDFS_BUCKETS = {
  media: "media", // 视频、大图片等媒体文件
};

export const USER_FIELDS = {
  name: "name", // 姓名（登录名，唯一标识）
  passwordHash: "passwordHash",
  gender: "gender", // 性别
  grade: "grade", // 年级
  className: "className", // 班级
  managedClasses: "managedClasses", // 教师管理的班级列表
  subjects: "subjects", // 教师的学科列表
  role: "role", // 'user' | 'teacher' | 'admin' | 'superadmin'
  banned: "banned", // 是否被封禁
  mustChangePassword: "mustChangePassword", // 是否必须修改密码
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  preferences: "preferences",
};

export const USER_ROLES = {
  user: "user",
  teacher: "teacher",
  admin: "admin",
  superadmin: "superadmin",
};

export const SESSION_FIELDS = {
  userId: "userId",
  token: "token",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
};

export const CARD_FIELDS = {
  userId: "userId",
  type: "type",
  payload: "payload",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

export const AUTH_CODE_FIELDS = {
  code: "code", // 授权码
  type: "type", // 'admin' | 'superadmin'
  usedBy: "usedBy", // 使用者的 userId，superadmin授权码只能使用一次
  usedAt: "usedAt", // 使用时间
};

export const CONVERSATION_FIELDS = {
  userId: "userId",
  title: "title",
  model: "model", // 'claude'
  messages: "messages",
  totalTokens: "totalTokens", // 总消耗 tokens
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  type: "type", // 'text' | 'voice' 对话类型
};

export const USAGE_STATS_FIELDS = {
  userId: "userId",
  model: "model",
  count: "count",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};
