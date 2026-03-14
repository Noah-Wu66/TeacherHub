'use client';

import { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@/store/ai-education/chatStore';
import Sidebar from '@/components/ai-education/Sidebar';
import ChatInterface from '@/components/ai-education/ChatInterface';
import ErrorBoundary from '@/components/ai-education/ErrorBoundary';
import LoginModal from '@/components/ai-education/auth/LoginModal';
import AccountModal from '@/components/ai-education/auth/AccountModal';
import { ThemeProvider } from '@/components/ai-education/ThemeProvider';
import { AlertCircle, WifiOff } from 'lucide-react';
import { apiFetch } from '@/lib/ai-education/api';

export default function HomePage() {
  const { error, setError, setPreferencesHydrated, setConversations } = useChatStore();
  const [isOnline, setIsOnline] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch('/ai-education/api/auth/status');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          // 如果需要强制修改密码，自动打开账户弹窗
          if (data.user.mustChangePassword) {
            setShowAccountModal(true);
          }
        } else {
          setShowLoginModal(true);
        }
      } catch {
        setShowLoginModal(true);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

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

  // 登录成功回调
  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setShowLoginModal(false);
    setPreferencesHydrated(false);
    refreshConversations();
    // 如果需要强制修改密码，自动打开账户弹窗
    if (userData?.mustChangePassword) {
      setShowAccountModal(true);
    }
  };

  // 密码修改成功回调
  const handlePasswordChanged = () => {
    // 更新用户状态，清除 mustChangePassword 标记
    setUser((prev: any) => prev ? { ...prev, mustChangePassword: false } : prev);
  };

  // 登出回调
  const handleLogout = () => {
    setUser(null);
    setShowLoginModal(true);
    setPreferencesHydrated(false);
  };

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
  if (!authChecked) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
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
              onOpenAccount={() => setShowAccountModal(true)}
            />
          </div>

          {/* 全局提示 */}
          <ErrorAlert />
          <NetworkStatus />

          {/* 登录弹窗 */}
          <LoginModal
            visible={showLoginModal}
            onSuccess={handleLoginSuccess}
          />

          {/* 账户管理弹窗 */}
          <AccountModal
            visible={showAccountModal}
            onClose={() => setShowAccountModal(false)}
            user={user}
            onLogout={handleLogout}
            onPasswordChanged={handlePasswordChanged}
          />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
