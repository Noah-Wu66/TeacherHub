export const COLLECTIONS = {
  users: "users",
  sessions: "sessions",
  videoCards: "video_cards",
  imageCards: "image_cards",
  imageAssets: "image_assets",
  authCodes: "auth_codes", // 授权码记录
  invitations: "invitations", // 正式注册邀请码
  conversations: "conversations", // 对话集合
  usageStats: "usage_stats", // 模型使用统计
  mathProgress: "math_progress", // 数学工具学习进度
  toolChatHistories: "tool_chat_histories", // 非智趣学工具聊天记录
} as const;

// GridFS Bucket 名称
export const GRIDFS_BUCKETS = {
  media: "media", // 视频、大图片等媒体文件
} as const;

export const USER_FIELDS = {
  name: "name", // 姓名（登录名，唯一标识）
  passwordHash: "passwordHash",
  accountType: "accountType", // 'formal' | 'guest'
  status: "status", // 'active' | 'banned'
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
  guestPurgeAt: "guestPurgeAt",
} as const;

export const USER_ROLES = {
  user: "student",
  student: "student",
  teacher: "teacher",
  admin: "admin",
  superadmin: "superadmin",
  guest: "guest",
} as const;

export const USER_ACCOUNT_TYPES = {
  formal: "formal",
  guest: "guest",
} as const;

export const USER_STATUSES = {
  active: "active",
  banned: "banned",
} as const;

export const SESSION_FIELDS = {
  userId: "userId",
  token: "token",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
} as const;

export const CARD_FIELDS = {
  userId: "userId",
  type: "type",
  payload: "payload",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const AUTH_CODE_FIELDS = {
  code: "code", // 授权码
  type: "type", // 'admin' | 'superadmin'
  usedBy: "usedBy", // 使用者的 userId，superadmin授权码只能使用一次
  usedAt: "usedAt", // 使用时间
} as const;

export const INVITATION_FIELDS = {
  code: "code",
  targetRole: "targetRole", // 'student' | 'teacher'
  status: "status", // 'active' | 'used' | 'revoked'
  createdBy: "createdBy",
  usedBy: "usedBy",
  usedAt: "usedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const CONVERSATION_FIELDS = {
  userId: "userId",
  title: "title",
  model: "model", // 'claude'
  messages: "messages",
  totalTokens: "totalTokens", // 总消耗 tokens
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  type: "type", // 'text' | 'voice' 对话类型
} as const;

export const USAGE_STATS_FIELDS = {
  userId: "userId",
  model: "model",
  count: "count",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const MATH_PROGRESS_FIELDS = {
  userId: "userId",
  grade: "grade",
  chapter: "chapter",
  totalQuestions: "totalQuestions",
  correctAnswers: "correctAnswers",
  streak: "streak",
  maxStreak: "maxStreak",
  lastPlayed: "lastPlayed",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const TOOL_CHAT_HISTORY_FIELDS = {
  userId: "userId",
  tool: "tool",
  messages: "messages",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;
