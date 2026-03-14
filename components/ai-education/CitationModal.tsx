'use client';

import { X, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import Image from 'next/image';
import { WebSearchCitation } from '@/lib/ai-education/types';

interface CitationModalProps {
  citations: WebSearchCitation[];
  searchQuery?: string;
  onClose: () => void;
}

export default function CitationModal({ citations, searchQuery, onClose }: CitationModalProps) {
  // 按ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 提取域名
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // 获取favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] h-auto overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">搜索来源</h2>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-1">查询: {searchQuery}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-accent transition-colors"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {citations.map((citation, idx) => (
            <a
              key={idx}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border bg-muted/30 p-4 hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Favicon */}
                <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-background border border-border">
                  <Image
                    src={getFaviconUrl(citation.url)}
                    alt=""
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* 标题 */}
                  <div className="flex items-start gap-2">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {citation.title}
                    </h3>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground mt-0.5" />
                  </div>

                  {/* 引用文本 */}
                  {citation.cited_text && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {citation.cited_text}
                    </p>
                  )}

                  {/* URL */}
                  <p className="text-xs text-muted-foreground/70 mt-2 truncate">
                    {getDomain(citation.url)}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            共找到 {citations.length} 个来源
          </p>
        </div>
      </div>
    </div>
  );
}

