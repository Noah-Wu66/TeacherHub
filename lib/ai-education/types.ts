// Web搜索引用类型
export interface WebSearchCitation {
  type: 'web_search_result_location';
  url: string;
  title: string;
  cited_text: string;
  encrypted_index?: string;
}

// 消息类型定义
export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  timestamp: Date;
  model?: string;
  images?: string[];
  videos?: string[];
  functionCall?: {
    name: string;
    arguments: string;
  };
  functionResult?: {
    name: string;
    result: string;
  };
  metadata?: {
    reasoning?: string;
    verbosity?: 'low' | 'medium' | 'high';
    tokensUsed?: number;
    citations?: WebSearchCitation[];
    searchQuery?: string;
    imageSize?: string;
  };
}

// 对话类型
export type ConversationType = 'text' | 'voice';

// 对话会话类型
export interface Conversation {
  id: string;
  userId?: string; // 可选，用于兼容旧数据
  title: string;
  messages: Message[];
  messageCount?: number; // 消息数量（用于列表显示）
  createdAt: Date;
  updatedAt: Date;
  model: string;
  settings: ConversationSettings;
  type?: ConversationType; // 对话类型：text=文本对话，voice=语音通话
  // 可选：用于区分不同专题/页面的对话（例如大思政课）
  route?: string;
  dasiZhengke?: {
    topicId?: string;
    audience?: 'student' | 'teacher';
  };
}

// 对话设置
export interface ConversationSettings {
  stream?: boolean;
  // 音效提醒设置
  sound?: {
    onComplete?: boolean;
  };
  // 开发者模式
  developerMode?: boolean;
}

// 支持的模型列表
export const MODELS: Record<string, ModelConfig> = {
  'gemini-3-flash-preview': {
    name: 'Gemini 3 Flash (Preview)',
    description: 'Gemini 3 Flash Preview 多模态文本生成',
    type: 'chat',
    supportsVision: true,
    supportsTools: false,
    supportsReasoning: true,
    supportsVerbosity: false,
    supportsTemperature: false,
    maxTokens: 65536,
  },
};

export type ModelId = keyof typeof MODELS;

// 模型配置类型
export interface ModelConfig {
  name: string;
  description: string;
  type: 'chat' | 'responses';
  supportsVision?: boolean;
  supportsTools?: boolean;
  supportsReasoning?: boolean;
  supportsVerbosity?: boolean;
  supportsTemperature?: boolean;
  maxTokens: number;
}

// 类型安全的模型配置获取函数
export function getModelConfig(model: ModelId | string): ModelConfig {
  const config = MODELS[model as ModelId];
  if (config) return config;
  const fallbackModel = 'gemini-3-flash-preview' as ModelId;
  return MODELS[fallbackModel];
}
