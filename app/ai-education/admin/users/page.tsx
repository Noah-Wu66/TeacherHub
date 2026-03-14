'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, AlertCircle, Database } from 'lucide-react';
import { apiFetch } from '@/lib/ai-education/api';
import StudentRow from './components/StudentRow';
import ResetPasswordModal from './components/ResetPasswordModal';
import type { Conversation, ConversationStats, UsageStats, User } from './types';

export default function StudentsManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<{ name: string; password: string } | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [studentConversations, setStudentConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/ai-education/api/admin/users');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || '加载失败');
      }
      const data = await res.json();
      const students = (data.users || []).filter((u: User) => u.role === 'student' || u.role === 'user');
      setUsers(students);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadConversationStats = async () => {
    try {
      const res = await apiFetch('/ai-education/api/admin/cleanup-old-conversations');
      if (res.ok) {
        const data = await res.json();
        setConversationStats(data);
      }
    } catch {
      // 忽略错误
    }
  };

  const loadCurrentUser = async () => {
    try {
      const res = await apiFetch('/ai-education/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      }
    } catch {
      // 忽略错误
    }
  };

  const loadUsageStats = async () => {
    try {
      const res = await apiFetch('/ai-education/api/admin/usage-stats');
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data.users || []);
      }
    } catch {
      // 忽略错误
    }
  };

  const loadStudentConversations = async (userId: string) => {
    setConversationsLoading(true);
    try {
      const res = await apiFetch(`/ai-education/api/admin/student-conversations?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setStudentConversations(data.conversations || []);
      }
    } catch {
      setStudentConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadConversationStats();
    loadUsageStats();
    loadCurrentUser();
  }, []);

  const handleExpandStudent = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setStudentConversations([]);
      setExpandedConversationId(null);
    } else {
      setExpandedUserId(userId);
      setExpandedConversationId(null);
      await loadStudentConversations(userId);
    }
  };

  const handleAction = async (userId: string, action: 'ban' | 'unban' | 'delete') => {
    const confirmMessages = {
      ban: '确定要封禁此学生吗?',
      unban: '确定要解封此学生吗?',
      delete: '确定要删除此学生吗? 此操作不可恢复,将删除学生的所有数据!',
    };

    if (!confirm(confirmMessages[action])) return;

    setActionLoading(userId);
    try {
      const res = await apiFetch('/ai-education/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || '操作失败');
      }

      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`确定要重置学生 ${userName} 的密码吗?\n\n重置后学生需要使用新密码登录,并强制修改密码。`)) return;

    setActionLoading(userId);
    try {
      const res = await apiFetch('/ai-education/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reset-password' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || '重置失败');
      }

      setResetPasswordModal({ name: userName, password: data.newPassword });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '重置失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateClass = async (userId: string, newClassName: string) => {
    setActionLoading(userId);
    try {
      const res = await apiFetch('/ai-education/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'update-class', className: newClassName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || '更新失败');
      }

      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '更新班级失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanupAllData = async () => {
    if (!conversationStats || conversationStats.totalCount === 0) {
      alert('没有需要清理的历史记录');
      return;
    }

    const confirmed = confirm(
      `⚠️ 警告:确定要清理全部 ${conversationStats.totalCount} 条历史记录吗?\n\n` +
      `此操作将删除所有用户的所有历史对话记录,删除后不可恢复!\n\n` +
      `请再次确认是否继续?`
    );

    if (!confirmed) return;

    const doubleConfirmed = confirm(
      `🚨 最后确认!\n\n` +
      `即将删除 ${conversationStats.totalCount} 条历史记录!\n\n` +
      `此操作不可撤销,确定继续吗?`
    );

    if (!doubleConfirmed) return;

    setCleanupLoading(true);
    try {
      const res = await apiFetch('/ai-education/api/admin/cleanup-old-conversations', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || '清理失败');
      }

      const data = await res.json();
      alert(data.message || '清理成功');

      await loadConversationStats();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '清理失败');
    } finally {
      setCleanupLoading(false);
    }
  };

  const getStudentStats = (userId: string) => {
    return usageStats.find((s) => s.userId === userId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <div className="text-sm text-destructive">{error}</div>
          <button
            onClick={loadUsers}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/ai-education"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="返回首页"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">学生管理</h1>
            <p className="text-sm text-muted-foreground">管理学生账户、查看统计和对话记录</p>
          </div>
          <div className="text-sm text-muted-foreground">
            共 {users.length} 个学生
          </div>
        </div>

        {currentUser?.role === 'superadmin' && conversationStats && (
          <div className="rounded-lg border bg-card p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 dark:bg-red-950/30 p-3">
                <Database className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">历史记录数据清理</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  清理所有用户的全部历史对话记录
                </p>
                <div className="rounded-lg bg-muted/50 p-4 mb-4">
                  <div className="text-xs text-muted-foreground mb-1">历史记录总数</div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {conversationStats.totalCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    包含所有用户的对话记录
                  </div>
                </div>
                <button
                  onClick={handleCleanupAllData}
                  disabled={cleanupLoading || conversationStats.totalCount === 0}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {cleanupLoading ? '清理中...' : `清理全部历史记录 (${conversationStats.totalCount} 条)`}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 border-b p-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium">
              <div className="col-span-2">姓名</div>
              <div className="col-span-1">性别</div>
              <div className="col-span-2">年级</div>
              <div className="col-span-2">班级</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-3 text-right">操作</div>
            </div>
          </div>
          <div className="divide-y">
            {users.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                暂无学生
              </div>
            ) : (
              users.map((user) => (
                <StudentRow
                  key={user.id}
                  user={user}
                  isExpanded={expandedUserId === user.id}
                  onExpand={() => handleExpandStudent(user.id)}
                  onAction={handleAction}
                  onResetPassword={handleResetPassword}
                  onUpdateClass={handleUpdateClass}
                  actionLoading={actionLoading === user.id}
                  stats={getStudentStats(user.id)}
                  conversations={expandedUserId === user.id ? studentConversations : []}
                  conversationsLoading={expandedUserId === user.id && conversationsLoading}
                  expandedConversationId={expandedConversationId}
                  onExpandConversation={(id) => setExpandedConversationId(expandedConversationId === id ? null : id)}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {resetPasswordModal && (
        <ResetPasswordModal
          name={resetPasswordModal.name}
          password={resetPasswordModal.password}
          onClose={() => setResetPasswordModal(null)}
        />
      )}
    </div>
  );
}
