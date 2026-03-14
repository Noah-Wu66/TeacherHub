// API配置和工具函数
const API_CONFIG = {
  baseURL: '', // 使用相对路径，因为前后端在同一服务
  timeout: 30000
};

// API请求工具
export class APIClient {
  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let detail = '';
        try {
          const err = await response.json();
          detail = err && err.detail ? err.detail : JSON.stringify(err);
        } catch (e) {
          try { detail = await response.text(); } catch {}
        }
        throw new Error(`HTTP ${response.status}: ${detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到服务器，请确保后端服务已启动');
      }
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new APIClient();

export async function chatWithAI(message, interactionState, chatHistory = [], isNewConversation = false) {
  return apiClient.post('/planting/api/chat', {
    message,
    interaction_state: interactionState,
    chat_history: chatHistory,
    is_new_conversation: isNewConversation
  });
}

export async function healthCheck() {
  return apiClient.get('/planting/api/health');
}


