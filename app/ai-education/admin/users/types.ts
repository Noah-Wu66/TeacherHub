export interface User {
  id: string;
  name: string;
  gender: string;
  grade: string;
  className: string;
  role: string;
  banned: boolean;
  createdAt: string;
}

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: ConversationMessage[];
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  userId: string;
  name: string;
  role: string;
  usage: Record<string, number>;
  total: number;
}

export interface ConversationStats {
  totalCount: number;
}


