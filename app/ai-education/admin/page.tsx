'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, MessageSquare, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/ai-education/api';

interface ConversationStat {
  model: string;
  count: number;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalConversations: number;
    totalMessages: number;
    modelStats: ConversationStat[];
  }>({ totalConversations: 0, totalMessages: 0, modelStats: [] });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch('/ai-education/api/conversations');
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || '无法获取数据');
        }
        const conversations = await response.json();
        
        // 计算统计数据
        const totalConversations = Array.isArray(conversations) ? conversations.length : 0;
        let totalMessages = 0;
        const modelCounts: Record<string, number> = {};
        
        if (Array.isArray(conversations)) {
          for (const conv of conversations) {
            totalMessages += Array.isArray(conv.messages) ? conv.messages.length : 0;
            const model = conv.model || 'unknown';
            modelCounts[model] = (modelCounts[model] || 0) + 1;
          }
        }
        
        const modelStats = Object.entries(modelCounts).map(([model, count]) => ({
          model,
          count,
        })).sort((a, b) => b.count - a.count);
        
        setStats({ totalConversations, totalMessages, modelStats });
      } catch (e: any) {
        setError(e?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl p-4 sm:p-6 md:p-8 space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-4">
          <Link
            href="/ai-education"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground touch-manipulation"
            aria-label="返回首页"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">系统管理</h1>
            <p className="text-sm text-muted-foreground">查看系统统计信息</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">对话总数</p>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">消息总数</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 模型使用统计 */}
        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h2 className="font-semibold">模型使用统计</h2>
          </div>
          <div className="divide-y">
            {stats.modelStats.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                暂无数据
              </div>
            ) : (
              stats.modelStats.map((stat) => (
                <div key={stat.model} className="p-4 flex items-center justify-between">
                  <div className="font-medium">{stat.model}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat.count} 个对话
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 退出按钮 */}
        <div className="pt-4">
          <button
            onClick={async () => {
              try {
                await apiFetch('/ai-education/api/auth/logout', {
                  method: 'POST',
                });
              } catch {
                // 忽略错误
              }
              window.location.href = '/';
            }}
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent touch-manipulation"
          >
            退出管理
          </button>
        </div>
      </div>
    </div>
  );
}
