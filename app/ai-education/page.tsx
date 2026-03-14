'use client';

import { useEffect, useCallback, useState } from 'react';
import { useChatStore } from '@/store/ai-education/chatStore';
import Sidebar from '@/components/ai-education/Sidebar';
import ChatInterface from '@/components/ai-education/ChatInterface';
import ErrorBoundary from '@/components/ai-education/ErrorBoundary';
import { ThemeProvider } from '@/components/ai-education/ThemeProvider';
import { AlertCircle, WifiOff } from 'lucide-react';
import { apiFetch } from '@/lib/ai-education/api';
import { useAuth } from '@/components/platform/auth/AuthProvider';
import { useAccessControl } from '@/components/platform/auth/useAccessControl';

export default function HomePage() {
  const { error, setError, setPreferencesHydrated, setConversations } = useChatStore();
  const [isOnline, setIsOnline] = useState(true);
  const { user, openAccountDialog } = useAuth();
  const { loading, allowed } = useAccessControl({
    allowGuest: false,
    reason: '智趣学平台仅正式用户可访问，请先登录正式账号。',
  });

  // 登录后刷新对话列表，避免首次加载因未登录返回空列表
  const refreshConversations = useCallback(async () => {
    try {
      const res = await apiFetch('/ai-education/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    }
  }, [setConversations]);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (allowed && user) {
      setPreferencesHydrated(false);
      refreshConversations();
      if (user.mustChangePassword) {
        openAccountDialog();
      }
    }
  }, [allowed, openAccountDialog, refreshConversations, setPreferencesHydrated, user]);

  // 错误提示组件
  const ErrorAlert = () => {
    if (!error) return null;

    return (
      <div className="fixed top-16 right-4 z-50 max-w-md rounded-lg border border-destructive bg-destructive/10 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-destructive">出错了</h4>
            <pre className="text-sm text-destructive/80 mt-1 whitespace-pre-wrap break-words">{error}</pre>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive/80"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // 网络状态提示
  const NetworkStatus = () => {
    if (isOnline) return null;

    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
        <WifiOff className="h-4 w-4" />
        网络连接已断开
      </div>
    );
  };

  // 认证检查中,显示加载状态
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!allowed || !user) {
    return <div className="h-full bg-background" />;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="flex h-full">
          {/* 侧边栏 */}
          <Sidebar />

          {/* 主内容区域 */}
          <div className="flex-1 flex flex-col min-w-0">
            <ChatInterface
              user={user}
              onOpenAccount={openAccountDialog}
            />
          </div>

          {/* 全局提示 */}
          <ErrorAlert />
          <NetworkStatus />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
