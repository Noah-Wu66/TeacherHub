'use client';

import { useState } from 'react';
import { Copy, Check, CheckCircle } from 'lucide-react';

export default function ResetPasswordModal({
  name,
  password,
  onClose,
}: {
  name: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold">密码重置成功</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          学生 <span className="font-medium text-foreground">{name}</span> 的密码已重置为:
        </p>

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
          <code className="flex-1 text-lg font-mono font-bold tracking-wider">{password}</code>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="复制密码"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
          <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">请注意:</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
            <li>请将此密码安全地告知学生</li>
            <li>学生登录后将被强制要求修改密码</li>
            <li>关闭此窗口后将无法再次查看密码</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          我已记录，关闭窗口
        </button>
      </div>
    </div>
  );
}


