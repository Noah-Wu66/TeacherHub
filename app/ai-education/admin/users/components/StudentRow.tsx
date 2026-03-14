'use client';

import { useState } from 'react';
import {
  Ban,
  Trash2,
  CheckCircle,
  Key,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  BarChart,
} from 'lucide-react';

import type { Conversation, UsageStats, User } from '../types';

export default function StudentRow({
  user,
  isExpanded,
  onExpand,
  onAction,
  onResetPassword,
  onUpdateClass,
  actionLoading,
  stats,
  conversations,
  conversationsLoading,
  expandedConversationId,
  onExpandConversation,
  formatDate,
}: {
  user: User;
  isExpanded: boolean;
  onExpand: () => void;
  onAction: (userId: string, action: 'ban' | 'unban' | 'delete') => void;
  onResetPassword: (userId: string, userName: string) => void;
  onUpdateClass: (userId: string, className: string) => void;
  actionLoading: boolean;
  stats?: UsageStats;
  conversations: Conversation[];
  conversationsLoading: boolean;
  expandedConversationId: string | null;
  onExpandConversation: (id: string) => void;
  formatDate: (dateStr: string) => string;
}) {
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState(user.className || '');

  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    onUpdateClass(user.id, newClass);
    setIsEditingClass(false);
  };

  return (
    <div className="bg-background">
      {/* 主行 */}
      <div className="p-4 hover:bg-muted/30 transition-colors">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-2">
            <div className="font-medium text-sm">{user.name || '未填写'}</div>
          </div>
          <div className="col-span-1">
            <div className="text-sm text-muted-foreground">{user.gender || '未填写'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-muted-foreground">{user.grade || '未填写'}</div>
          </div>
          <div className="col-span-2">
            {isEditingClass ? (
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                onBlur={() => setIsEditingClass(false)}
                autoFocus
                className="w-full px-1 py-0.5 text-xs bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">未选择</option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={`${num}班`}>{num}班</option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setIsEditingClass(true)}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                title="点击修改班级"
              >
                {user.className || '未选择'}
              </button>
            )}
          </div>
          <div className="col-span-2">
            {user.banned ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30">
                <Ban className="h-3 w-3" />
                已封禁
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-3 w-3" />
                正常
              </span>
            )}
          </div>
          <div className="col-span-3">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onExpand}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                详情
              </button>
              <button
                onClick={() => onResetPassword(user.id, user.name)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Key className="h-3 w-3" />
                重置密码
              </button>
              {user.banned ? (
                <button
                  onClick={() => onAction(user.id, 'unban')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  解封
                </button>
              ) : (
                <button
                  onClick={() => onAction(user.id, 'ban')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  封禁
                </button>
              )}
              <button
                onClick={() => onAction(user.id, 'delete')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 展开详情 */}
      {isExpanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {/* 使用统计 */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              使用统计
            </h4>
            {stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">总使用次数</div>
                </div>
                {Object.entries(stats.usage).map(([model, count]) => (
                  <div key={model} className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground truncate">{model}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">暂无使用记录</div>
            )}
          </div>

          {/* 对话记录 */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              对话记录 ({conversations.length})
            </h4>
            {conversationsLoading ? (
              <div className="text-sm text-muted-foreground">加载中...</div>
            ) : conversations.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无对话记录</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {conversations.map((conv) => (
                  <div key={conv.id} className="border rounded-lg">
                    <button
                      onClick={() => onExpandConversation(conv.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{conv.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(conv.updatedAt)} · {conv.messages.length} 条消息 · {conv.totalTokens} tokens
                        </div>
                      </div>
                      {expandedConversationId === conv.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {expandedConversationId === conv.id && (
                      <div className="border-t p-3 space-y-2 max-h-64 overflow-y-auto bg-muted/30">
                        {conv.messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-sm ${msg.role === 'user'
                              ? 'bg-primary/10 text-foreground'
                              : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            <div className="text-xs font-medium mb-1 opacity-70">
                              {msg.role === 'user' ? '学生' : 'AI'}
                            </div>
                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


