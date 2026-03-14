import { create } from 'zustand';
import {
  Conversation,
  Message,
  ModelId,
  ConversationSettings,
} from '@/lib/ai-education/types';
import {
  ModelParams,
  cloneModelParams,
} from '@/lib/ai-education/modelParams';
import { DEFAULT_MODEL_ID } from '@/lib/ai-education/modelPreferences';

interface ChatState {
  // 当前对话
  currentConversation: Conversation | null;

  // 对话列表
  conversations: Conversation[];

  // 当前选择的模型
  currentModel: ModelId;

  // 对话设置
  settings: ConversationSettings;

  // 模型参数
  modelParams: ModelParams;

  // UI 状态
  isStreaming: boolean;
  sidebarOpen: boolean;
  preferencesHydrated: boolean;

  // 错误状态
  error: string | null;

  // 预填输入区的图片（用于“将图变视频”等跨组件操作）
  presetInputImages: string[];

  // 上下文记忆开关（默认开启）
  enableContext: boolean;

  // 通话模式（开启后模型返回内容会被朗读）
  voiceMode: boolean;

  // Actions
  setCurrentConversation: (conversation: Conversation | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  setCurrentModel: (model: ModelId) => void;
  setSettings: (settings: Partial<ConversationSettings>) => void;
  setModelParams: (params: Partial<ModelParams>) => void;
  setPreferencesHydrated: (hydrated: boolean) => void;

  setStreaming: (streaming: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setEnableContext: (enable: boolean) => void;
  setVoiceMode: (enabled: boolean) => void;
  setError: (error: string | null) => void;

  // 预填图片操作
  setPresetInputImages: (images: string[]) => void;

  // 消息操作
  addMessage: (message: Message, conversationId?: string) => void;
  insertMessage: (message: Message, afterMessageId: string, conversationId?: string) => void;
  updateMessage: (messageId: string, updates: Partial<Message>, conversationId?: string) => void;
  deleteMessages: (messageIds: string[], conversationId?: string) => void;

  // 重置状态
  reset: () => void;
}

const defaultSettings: ConversationSettings = {
  stream: true,
  sound: {
    onComplete: true,
  },
  developerMode: false,
};

export const useChatStore = create<ChatState>()((set) => ({
  // 初始状态
  currentConversation: null,
  conversations: [],
  currentModel: DEFAULT_MODEL_ID,
  settings: defaultSettings,
  modelParams: cloneModelParams(),
  isStreaming: false,
  sidebarOpen: false,
  preferencesHydrated: false,
  error: null,
  presetInputImages: [],
  enableContext: true,
  voiceMode: false,

  // Actions
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  setConversations: (conversations) => {
    set({ conversations });
  },

  addConversation: (conversation) => {
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
  },

  updateConversation: (id, updates) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    }));
  },

  deleteConversation: (id) => {
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      currentConversation:
        state.currentConversation?.id === id
          ? null
          : state.currentConversation,
    }));
  },

  setCurrentModel: (model) => {
    set({ currentModel: model });
  },

  setSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  setModelParams: (newParams) => {
    set((state) => ({
      modelParams: { ...state.modelParams, ...newParams },
    }));
  },

  setPreferencesHydrated: (hydrated) => {
    set({ preferencesHydrated: hydrated });
  },

  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  setEnableContext: (enable) => {
    set({ enableContext: enable });
  },

  setVoiceMode: (enabled) => {
    set({ voiceMode: enabled });
  },

  setError: (error) => {
    set({ error });
  },

  setPresetInputImages: (images) => {
    set({ presetInputImages: Array.isArray(images) ? images : [] });
  },

  addMessage: (message, conversationId) => {
    set((state) => {
      const targetId = conversationId ?? state.currentConversation?.id;
      if (!targetId) return state;

      // 优先使用 currentConversation（包含完整消息列表），避免使用 conversations 列表中的空消息数组
      const currentConvMatch = state.currentConversation?.id === targetId ? state.currentConversation : null;
      const existingConversation = state.conversations.find((conv) => conv.id === targetId) || null;
      const baseConversation = currentConvMatch || existingConversation;

      if (!baseConversation) return state;

      const updatedConversation = {
        ...baseConversation,
        messages: [...baseConversation.messages, message],
        updatedAt: new Date(),
      };

      const patch: Partial<ChatState> = {
        conversations: existingConversation
          ? state.conversations.map((conv) =>
            conv.id === targetId ? updatedConversation : conv
          )
          : [...state.conversations, updatedConversation],
      };

      if (state.currentConversation?.id === targetId) {
        patch.currentConversation = updatedConversation;
      }

      return patch;
    });
  },

  insertMessage: (message, afterMessageId, conversationId) => {
    set((state) => {
      const targetId = conversationId ?? state.currentConversation?.id;
      if (!targetId) return state;

      const currentConvMatch = state.currentConversation?.id === targetId ? state.currentConversation : null;
      const existingConversation = state.conversations.find((conv) => conv.id === targetId) || null;
      const baseConversation = currentConvMatch || existingConversation;

      if (!baseConversation) return state;

      const msgs = [...baseConversation.messages];
      const index = msgs.findIndex(m => m.id === afterMessageId);
      if (index === -1) return state;

      msgs.splice(index + 1, 0, message);

      const updatedConversation = {
        ...baseConversation,
        messages: msgs,
        updatedAt: new Date(),
      };

      const patch: Partial<ChatState> = {
        conversations: existingConversation
          ? state.conversations.map((conv) =>
            conv.id === targetId ? updatedConversation : conv
          )
          : [...state.conversations, updatedConversation],
      };

      if (state.currentConversation?.id === targetId) {
        patch.currentConversation = updatedConversation;
      }

      return patch;
    });
  },

  updateMessage: (messageId, updates, conversationId) => {
    set((state) => {
      const targetId = conversationId ?? state.currentConversation?.id;
      if (!targetId) return state;

      // 优先使用 currentConversation（包含完整消息列表），避免使用 conversations 列表中的空消息数组
      const currentConvMatch = state.currentConversation?.id === targetId ? state.currentConversation : null;
      const existingConversation = state.conversations.find((conv) => conv.id === targetId) || null;
      const baseConversation = currentConvMatch || existingConversation;

      if (!baseConversation) return state;

      let hasChanged = false;
      const updatedMessages = baseConversation.messages.map((msg) => {
        if (msg.id !== messageId) return msg;

        // 优化：检查内容是否真的改变，避免不必要的重渲染
        const actuallyChanged = Object.keys(updates).some(key => {
          const oldVal = (msg as any)[key];
          const newVal = (updates as any)[key];
          // 简单值比较
          if (typeof oldVal !== 'object' && typeof newVal !== 'object') {
            return oldVal !== newVal;
          }
          // 数组比较（如 images）
          if (Array.isArray(oldVal) && Array.isArray(newVal)) {
            return JSON.stringify(oldVal) !== JSON.stringify(newVal);
          }
          // 对象比较
          return JSON.stringify(oldVal) !== JSON.stringify(newVal);
        });

        if (!actuallyChanged) return msg;

        hasChanged = true;
        return { ...msg, ...updates };
      });

      if (!hasChanged) return state;

      const updatedConversation = {
        ...baseConversation,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      const patch: Partial<ChatState> = {
        conversations: existingConversation
          ? state.conversations.map((conv) =>
            conv.id === targetId ? updatedConversation : conv
          )
          : [...state.conversations, updatedConversation],
      };

      if (state.currentConversation?.id === targetId) {
        patch.currentConversation = updatedConversation;
      }

      return patch;
    });
  },

  deleteMessages: (messageIds, conversationId) => {
    set((state) => {
      const targetId = conversationId ?? state.currentConversation?.id;
      if (!targetId) return state;

      // 优先使用 currentConversation（包含完整消息列表），避免使用 conversations 列表中的空消息数组
      const currentConvMatch = state.currentConversation?.id === targetId ? state.currentConversation : null;
      const existingConversation = state.conversations.find((conv) => conv.id === targetId) || null;
      const baseConversation = currentConvMatch || existingConversation;

      if (!baseConversation) return state;

      const filteredMessages = baseConversation.messages.filter(
        (msg) => !messageIds.includes(msg.id)
      );

      if (filteredMessages.length === baseConversation.messages.length) {
        return state;
      }

      const updatedConversation = {
        ...baseConversation,
        messages: filteredMessages,
        updatedAt: new Date(),
      };

      const patch: Partial<ChatState> = {
        conversations: existingConversation
          ? state.conversations.map((conv) =>
            conv.id === targetId ? updatedConversation : conv
          )
          : [...state.conversations, updatedConversation],
      };

      if (state.currentConversation?.id === targetId) {
        patch.currentConversation = updatedConversation;
      }

      return patch;
    });
  },

  reset: () => {
    set((state) => ({
      currentConversation: null,
      conversations: [],
      // 保持用户的偏好设置
      currentModel: state.currentModel,
      settings: state.settings,
      modelParams: state.modelParams,
      isStreaming: false,
      sidebarOpen: true,
      preferencesHydrated: state.preferencesHydrated,
      error: null,
    }));
  },
}));