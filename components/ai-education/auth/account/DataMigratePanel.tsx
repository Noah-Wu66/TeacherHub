'use client';

import { useState } from 'react';
import { X, Database, Download, AlertCircle } from 'lucide-react';

interface DataMigratePanelProps {
  onClose: () => void;
  setError: (error: string) => void;
  setMessage: (message: string) => void;
}

export default function DataMigratePanel({
  onClose,
  setError,
  setMessage,
}: DataMigratePanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setError('');
    try {
      const response = await fetch('/ai-education/api/admin/export-data');
      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-education-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('数据导出成功！');
    } catch (error) {
      setError(error instanceof Error ? error.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/ai-education/api/admin/import-data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('导入失败');
      }

      setMessage('数据导入成功！');
    } catch (error) {
      setError(error instanceof Error ? error.message : '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          数据迁移
        </h3>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-accent"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            数据迁移功能请谨慎使用。建议先导出备份，再进行导入操作。
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Download className="h-5 w-5" />
          {isExporting ? '导出中...' : '导出数据'}
        </button>

        <div>
          <label className="block">
            <span className="sr-only">导入数据</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-3 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-green-500 file:text-white
                hover:file:bg-green-600
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            />
          </label>
          {isImporting && (
            <p className="text-sm text-center mt-2 text-muted-foreground">导入中...</p>
          )}
        </div>
      </div>
    </div>
  );
}
