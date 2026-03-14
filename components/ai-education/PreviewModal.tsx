'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Download, ExternalLink } from 'lucide-react';

type PreviewType = 'image' | 'video';

interface PreviewModalProps {
  src: string;
  type: PreviewType;
  onClose: () => void;
  filename?: string;
}

export default function PreviewModal({
  src,
  type,
  onClose,
  filename = 'media',
}: PreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (videoRef.current) {
      videoRef.current.volume = 0.5;
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[95vh] sm:max-h-[92vh] w-auto max-w-[95vw] sm:max-w-[92vw] overflow-hidden rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-3 sm:px-4 py-3 sm:py-2">
          <div className="text-sm font-medium">
            {type === 'video' ? '视频预览' : '图片预览'}
          </div>
          <div className="flex items-center gap-3 sm:gap-2">
            <a
              href={src}
              download={filename}
              className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 sm:px-2 sm:py-1 text-xs hover:bg-accent hover:text-accent-foreground touch-manipulation"
            >
              <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">下载</span>
            </a>
            <a
              href={src}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 sm:px-2 sm:py-1 text-xs hover:bg-accent hover:text-accent-foreground touch-manipulation"
            >
              <span className="hidden sm:inline">新窗口</span> <ExternalLink className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </a>
            <button
              type="button"
              className="rounded p-1.5 sm:p-1 hover:bg-accent touch-manipulation"
              onClick={onClose}
              aria-label="close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="max-h-[85vh] sm:max-h-[86vh] w-full overflow-auto p-1 sm:p-2">
          {type === 'video' ? (
            <video
              ref={videoRef}
              src={src}
              controls
              autoPlay
              className="mx-auto h-auto max-h-[80vh] w-auto max-w-[90vw] sm:max-w-[88vw] rounded-lg"
              preload="metadata"
            >
              您的浏览器不支持视频播放
            </video>
          ) : (
            <Image
              src={src}
              alt="预览"
              width={2048}
              height={2048}
              className="mx-auto h-auto max-h-[80vh] w-auto max-w-[90vw] sm:max-w-[88vw] object-contain"
              unoptimized
            />
          )}
        </div>
      </div>
    </div>
  );
}
