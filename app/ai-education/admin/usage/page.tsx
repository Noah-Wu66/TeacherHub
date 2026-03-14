'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, BarChart, Shield } from 'lucide-react';
import { apiFetch } from '@/lib/ai-education/api';
import { MODELS } from '@/lib/ai-education/types';

interface UsageRow {
  userId: string;
  name: string;
  role: string;
  usage: Record<string, number>;
  total: number;
}

export default function UsageAdminPage() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const modelList = useMemo(() => Object.entries(MODELS), []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/ai-education/api/admin/usage-stats');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || '加载失败');
      }
      setRows(Array.isArray(data?.users) ? data.users : []);
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <div className="text-sm text-destructive mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              用户使用统计
            </h1>
            <p className="text-sm text-muted-foreground">查看各模型累计调用次数</p>
          </div>
          <div className="text-sm text-muted-foreground">
            共 {rows.length} 个用户
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">姓名</th>
                  <th className="text-left p-4 font-medium text-sm">角色</th>
                  <th className="text-right p-4 font-medium text-sm">总计</th>
                  {modelList.map(([id, cfg]) => (
                    <th key={id} className="text-right p-4 font-medium text-sm whitespace-nowrap">
                      {cfg.name}
                    </th>
                  ))}
                  <th className="text-right p-4 font-medium text-sm">其它模型</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4 + modelList.length} className="p-8 text-center text-sm text-muted-foreground">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const extraModels = Object.keys(row.usage || {}).filter(
                      (m) => !(m in MODELS)
                    );
                    return (
                      <tr key={row.userId} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-sm">{row.name}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted/50">
                            <Shield className="h-3 w-3" />
                            {row.role === 'superadmin' ? '超级管理员' : row.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm font-semibold text-foreground">
                          {row.total}
                        </td>
                        {modelList.map(([id]) => (
                          <td key={id} className="p-4 text-right text-sm text-foreground">
                            {row.usage?.[id] || 0}
                          </td>
                        ))}
                        <td className="p-4 text-right text-sm text-muted-foreground">
                          {extraModels.length > 0
                            ? extraModels.map((m) => `${m}:${row.usage?.[m] || 0}`).join('、')
                            : '--'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

