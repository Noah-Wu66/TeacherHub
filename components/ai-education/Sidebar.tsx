'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit3,
  Menu,
  X,
  Loader2,
  Phone,
  Star,
} from 'lucide-react';
import { useChatStore } from '@/store/ai-education/chatStore';
import { Conversation, MODELS } from '@/lib/ai-education/types';
import { DASI_ZHENGKE_TOPICS } from '@/lib/ai-education/dasiZhengkeTopics';
import { formatRelativeTime, cn } from '@/utils/ai-education/helpers';
import { apiFetch } from '@/lib/ai-education/api';

export default function Sidebar() {
  const router = useRouter();
  const {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    setCurrentModel,
    sidebarOpen,
    setSidebarOpen,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(false);
  // 删除确认弹窗状态
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingDeleteTitle, setConfirmingDeleteTitle] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/ai-education/api/conversations');
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
      } else {
        setConversations([]);
      }
    } catch {
      // 忽略错误
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [setConversations]);

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 搜索对话
  const searchConversations = async (query: string) => {
    if (!query.trim()) {
      loadConversations();
      return;
    }
    try {
      const response = await apiFetch(`/ai-education/api/conversations?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
      } else {
        setConversations([]);
      }
    } catch {
      // 忽略错误
      setConversations([]);
    }
  };

  // 创建新对话
  const createNewConversation = () => {
    // 不创建后端空会话，仅进入空状态，待用户发送首条消息再创建
    setCurrentConversation(null);
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch { }
  };

  // 打开删除确认弹窗
  const openDeleteConfirm = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(conversation.id);
    setConfirmingDeleteTitle(conversation.title || '未命名对话');
  };

  // 执行删除
  const confirmDelete = async () => {
    if (!confirmingDeleteId) return;
    try {
      setDeleting(true);
      const response = await apiFetch(`/ai-education/api/conversations?id=${encodeURIComponent(confirmingDeleteId)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const res = await response.json();
        if (res?.ok) {
          setConversations(conversations.filter(conv => conv.id !== confirmingDeleteId));
          if (currentConversation?.id === confirmingDeleteId) {
            setCurrentConversation(null);
          }
        }
      }
    } catch {
      // 忽略错误
    } finally {
      setDeleting(false);
      setConfirmingDeleteId(null);
      setConfirmingDeleteTitle('');
    }
  };

  // 关闭删除确认弹窗
  const cancelDelete = () => {
    if (deleting) return;
    setConfirmingDeleteId(null);
    setConfirmingDeleteTitle('');
  };

  // 编辑对话标题
  const startEditing = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const saveTitle = async () => {
    if (!editingId || !editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await apiFetch('/ai-education/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, title: editTitle.trim() }),
      });
      if (response.ok) {
        const res = await response.json();
        if (res?.ok) {
          setConversations(conversations.map(conv =>
            conv.id === editingId
              ? { ...conv, title: editTitle.trim() }
              : conv
          ));
          if (currentConversation?.id === editingId) {
            setCurrentConversation({
              ...currentConversation,
              title: editTitle.trim(),
            });
          }
        }
      }
    } catch {
      // 忽略错误
    } finally {
      setEditingId(null);
      setEditTitle('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchConversations(query);
  };

  // 选择并加载对话详情
  const handleSelectConversation = async (conversation: Conversation) => {
    // 语音对话直接跳转到语音页面
    if (conversation.type === 'voice') {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
      router.push(`/ai-education/voice?id=${conversation.id}`);
      return;
    }

    // 大思政课专题对话：跳转到专题页面（而不是普通对话页）
    const isDasiZhengke = conversation.route === 'dasi-zhengke' || String(conversation.title || '').includes('大思政课');
    if (isDasiZhengke) {
      try {
        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      } catch { }

      const inferredTopicId = (() => {
        const explicit = (conversation as any)?.dasiZhengke?.topicId;
        if (explicit && typeof explicit === 'string') return explicit;
        const title = String(conversation.title || '');
        const match = DASI_ZHENGKE_TOPICS.find((t) => title.includes(t.title));
        return match?.id;
      })();

      const params = new URLSearchParams();
      params.set('id', conversation.id);
      if (inferredTopicId) params.set('topic', inferredTopicId);
      router.push(`/ai-education/dasi-zhengke?${params.toString()}`);
      return;
    }

    if (currentConversation?.id === conversation.id && currentConversation.messages.length > 0) {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
      return;
    }

    if (loadingId === conversation.id) return;

    try {
      setLoadingId(conversation.id);
      const response = await apiFetch(`/ai-education/api/conversations/${conversation.id}`);
      if (response.ok) {
        const detail = await response.json();
        setCurrentConversation(detail);
        // 自动切换到对话对应的模型
        if (detail.model && MODELS[detail.model]) {
          setCurrentModel(detail.model);
        }
        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      }
    } catch {
      // 忽略错误
    } finally {
      setLoadingId(null);
    }
  };

  // 按日期分组对话
  const groupedConversations = conversations.reduce((groups, conversation) => {
    const date = formatRelativeTime(new Date(conversation.updatedAt));
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(conversation);
    return groups;
  }, {} as Record<string, Conversation[]>);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-muted/30 pb-safe-area-inset-bottom">
      {/* 平台品牌 */}
      <div className="border-b border-border p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/ai-education/study.png" alt="智趣学" width={32} height={32} className="object-contain" />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">智趣学</h1>
              <p className="text-[10px] text-muted-foreground">AI学习平台</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden touch-manipulation"
            aria-label="关闭侧边栏"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 新建按钮 */}
      <div className="border-b border-border p-3 sm:p-4">
        <button
          onClick={createNewConversation}
          className="sidebar-new-chat flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          新建对话
        </button>
      </div>

      {/* 搜索 */}
      <div className="border-b border-border p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-muted-foreground">加载中...</div>
          </div>
        ) : Object.keys(groupedConversations).length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? '没有找到匹配的对话' : '还没有对话记录'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedConversations).map(([date, convs]) => (
              <div key={date} className="mb-3 sm:mb-4">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {date}
                </div>
                <div className="space-y-1">
                  {convs.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={cn(
                        "group relative cursor-pointer rounded-lg p-2 transition-colors hover:bg-accent touch-manipulation",
                        (currentConversation?.id === conversation.id || loadingId === conversation.id) && "bg-accent"
                      )}
                    >
                      {editingId === conversation.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={saveTitle}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1 min-w-0 mr-2">
                              {/* 对话类型图标 */}
                              <div className={cn(
                                "flex-shrink-0 mt-0.5 p-1 rounded",
                                conversation.type === 'voice'
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : conversation.route === 'dasi-zhengke'
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-primary/10 text-primary"
                              )}>
                                {conversation.type === 'voice' ? (
                                  <Phone className="h-3.5 w-3.5" />
                                ) : conversation.route === 'dasi-zhengke' ? (
                                  <Star className="h-3.5 w-3.5" />
                                ) : (
                                  <MessageSquare className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-medium truncate">
                                    {conversation.title}
                                  </h3>
                                  {loadingId === conversation.id && (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {conversation.type === 'voice' 
                                    ? '语音通话' 
                                    : conversation.route === 'dasi-zhengke'
                                      ? '大思政课'
                                      : `${conversation.messageCount ?? conversation.messages.length} 条消息`}
                                </p>
                              </div>
                            </div>

                            {/* 操作按钮 - 移动端总是显示 */}
                            <div className={cn(
                              "flex items-center gap-1 transition-opacity",
                              "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            )}>
                              <button
                                onClick={(e) => startEditing(conversation, e)}
                                className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground touch-manipulation"
                                title="编辑标题"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => openDeleteConfirm(conversation, e)}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground touch-manipulation"
                                title="删除对话"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 作者信息 */}
      <div className="border-t border-border p-3 sm:p-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">平台作者</p>
          <p className="text-xs font-medium mt-1">北京市朝阳区白家庄小学</p>
          <p className="text-xs font-medium text-primary">李雪</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 移动端菜单按钮 - 顶部靠左 */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="compact fixed top-2 left-2 z-40 rounded-md bg-background p-1.5 shadow-md border border-border lg:hidden touch-manipulation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* 桌面端侧边栏（始终显示） */}
      <div className={cn(
        "hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-border"
      )}>
        {sidebarContent}
      </div>

      {/* 移动端侧边栏 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {confirmingDeleteId && (
        <div className="fixed inset-0 z-[60] bg-black/40">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-3 sm:p-4">
                <h2 className="text-base sm:text-lg font-semibold">删除对话</h2>
                <button
                  onClick={cancelDelete}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground touch-manipulation"
                  aria-label="关闭"
                  disabled={deleting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3 sm:p-4 space-y-2">
                <p className="text-sm">确定要删除以下对话吗？此操作不可恢复。</p>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {confirmingDeleteTitle}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t p-3 sm:p-4">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent touch-manipulation disabled:opacity-60"
                  disabled={deleting}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 touch-manipulation disabled:opacity-60"
                  disabled={deleting}
                >
                  {deleting ? '正在删除...' : '删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
