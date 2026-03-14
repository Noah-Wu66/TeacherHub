'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Send, Paperclip, X, Image as ImageIcon, Square, Phone, Mic, Loader2, Star } from 'lucide-react';
import { useChatStore } from '@/store/ai-education/chatStore';
import { getModelConfig } from '@/lib/ai-education/types';
import { cn, compressImageSmart } from '@/utils/ai-education/helpers';
import { useQwenAsrInput } from '@/components/ai-education/chat/useQwenAsrInput';
import { upload } from '@vercel/blob/client';

const DEFAULT_MAX_IMAGES = 5;

interface MessageInputProps {
  onSendMessage: (content: string, images?: string[], media?: { audios?: string[]; videos?: string[] }) => void;
  disabled?: boolean;
  // UI 变体：默认底部输入，或首页居中大输入，或行内编辑模式
  variant?: 'default' | 'center' | 'inline';
  placeholder?: string;
  autoFocus?: boolean;
  onStop?: () => void;
  // 编辑模式支持
  initialValue?: string;
  initialImages?: string[];
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

export default function MessageInput({ onSendMessage, disabled, variant = 'default', placeholder, autoFocus, onStop, initialValue, initialImages, isEditing, onCancelEdit }: MessageInputProps) {
  const [message, setMessage] = useState(initialValue ?? '');
  const [images, setImages] = useState<string[]>(Array.isArray(initialImages) ? initialImages : []);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentModel, isStreaming, presetInputImages, setPresetInputImages } = useChatStore();
  const modelConfig = getModelConfig(currentModel);
  const maxImageCount = DEFAULT_MAX_IMAGES;
  const applyImageLimit = useCallback((list: string[]) => {
    if (list.length <= maxImageCount) return list;
    return list.slice(0, maxImageCount);
  }, [maxImageCount]);

  // 自动调整文本框高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const applyAsrText = useCallback((text: string) => {
    setMessage((prev) => {
      const prevTrim = prev.trim();
      if (!prevTrim) return text;
      const joiner = prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ';
      return prev + joiner + text;
    });
    requestAnimationFrame(() => adjustTextareaHeight());
    textareaRef.current?.focus();
  }, [adjustTextareaHeight]);

  const {
    isRecording: isAsrRecording,
    isProcessing: isAsrProcessing,
    start: startAsrRecording,
    stop: stopAsrRecording,
  } = useQwenAsrInput({
    disabled: disabled || isStreaming,
    maxDurationMs: 30000,
    onText: applyAsrText,
  });

  // 初始化后自动调整一次高度（确保编辑时初始高度正确）
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, initialValue]);

  // 同步外部初始值（进入/退出编辑时）
  useEffect(() => {
    if (typeof initialValue === 'string') setMessage(initialValue);
  }, [initialValue]);
  useEffect(() => {
    if (Array.isArray(initialImages)) {
      setImages(applyImageLimit(initialImages));
    }
  }, [initialImages, applyImageLimit]);

  useEffect(() => {
    setImages(prev => applyImageLimit(prev));
  }, [applyImageLimit]);

  // 监听预填图片
  useEffect(() => {
    if (Array.isArray(presetInputImages) && presetInputImages.length > 0) {
      setImages(prev => applyImageLimit([...prev, ...presetInputImages]));
      setPresetInputImages([]);
    }
  }, [presetInputImages, setPresetInputImages, applyImageLimit]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    adjustTextareaHeight();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 发送消息
  const handleSend = () => {
    if (!message.trim() && images.length === 0) return;
    if (disabled || isStreaming) return;

    onSendMessage(
      message.trim(),
      images.length > 0 ? images : undefined
    );

    // 非编辑模式下才清空
    if (!isEditing) {
      setMessage('');
      setImages([]);
      setPresetInputImages([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // 处理文件选择
  const handleFileSelect = async (files: FileList) => {
    if (!modelConfig.supportsVision) {
      alert('当前模型不支持文件上传');
      return;
    }

    const imageQuota = Math.max(0, maxImageCount - images.length);
    const imageFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f) continue;
      const t = f.type || '';
      if (t.startsWith('image/') && imageFiles.length < imageQuota) {
        imageFiles.push(f);
      }
    }

    // 处理图片：压缩后直传 Vercel Blob（public），避免 base64 进入请求体
    if (imageFiles.length > 0) {
      const newImages: string[] = [];
      for (const file of imageFiles) {
        try {
          const processed = await compressImageSmart(file, { maxWidth: 4096, maxHeight: 4096, maxBytes: 20 * 1024 * 1024, initialQuality: 0.92, mimeType: 'image/webp' });
          const result = await upload(processed.name, processed, {
            access: 'public',
            handleUploadUrl: '/ai-education/api/blob/upload',
          });
          newImages.push(result.url);
        } catch { }
      }

      if (newImages.length > 0) {
        setImages(prev => applyImageLimit([...prev, ...newImages]));
      }
    }
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = (message.trim() || images.length > 0) && !disabled && !isStreaming;
  const reachedImageLimit = images.length >= maxImageCount;
  const showStop = isStreaming;

  return (
    <div className={cn("relative", variant === 'center' && "max-w-2xl mx-auto")}>
      {/* 拖拽覆盖层 */}
      {isDragging && modelConfig.supportsVision && (
        <div className="drag-overlay flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-2 text-sm font-medium text-primary">拖拽图片到这里</p>
          </div>
        </div>
      )}

      {/* 语音通话 / 大思政课入口（编辑态不显示，避免干扰） */}
      {!isEditing && variant !== 'inline' && (
        <div className="mb-2 flex items-center gap-2">
          <a
            href="/ai-education/voice"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>语音通话</span>
          </a>

          <a
            href="/ai-education/dasi-zhengke?new=1"
            className={cn(
              "dasi-shine-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              "text-white border border-white/15",
              "bg-gradient-to-r from-red-700 via-red-600 to-orange-500",
              "shadow-[0_0_0_1px_rgba(244,63,94,0.25),0_12px_28px_rgba(244,63,94,0.25)]",
              "hover:brightness-110 active:brightness-105 transition-all"
            )}
            title="大思政课专题（新对话）"
          >
            <Star className="h-3.5 w-3.5" />
            <span>大思政课</span>
          </a>
        </div>
      )}



      {/* 媒体预览：图片 */}
      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div key={`img-${index}`} className="relative">
              <Image
                src={image}
                alt={`上传的图片 ${index + 1}`}
                width={80}
                height={80}
                className="image-preview h-16 w-16 sm:h-20 sm:w-20 object-cover"
                unoptimized
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground hover:bg-destructive/90 touch-manipulation"
                aria-label="移除图片"
                title="移除"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div
        className={cn(
          "relative border border-input bg-background",
          isDragging && "border-primary",
          // 样式变体
          variant === 'center' && "rounded-2xl shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70",
          variant === 'default' && "rounded-2xl",
          variant === 'inline' && "rounded-xl border-primary/50 shadow-sm bg-background"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ?? (
              modelConfig.supportsVision
                ? (variant === 'center' ? "今天想学点什么？" : "输入消息或拖拽图片...")
                : (variant === 'center' ? "今天想学点什么？" : "输入消息...")
            )
          }
          className={cn(
            "chat-input w-full border-0 bg-transparent focus:ring-0 resize-none",
            variant === 'center' ? "min-h-[48px] sm:min-h-[56px] text-sm sm:text-base px-3 sm:px-5 py-2.5 sm:py-4 rounded-2xl pr-24 sm:pr-32 pl-8 sm:pl-10" :
              variant === 'inline' ? "pr-16 pl-3 py-2 text-sm min-h-[40px]" :
                "pr-20 sm:pr-28 pl-6 sm:pl-8 py-2 sm:py-3"
          )}
          disabled={disabled || isStreaming}
          rows={1}
          autoFocus={autoFocus}
        />

        {/* 操作按钮 */}
        <div className={cn(
          "absolute flex items-center gap-0.5 sm:gap-1",
          variant === 'center' ? "right-1.5 bottom-1.5 sm:right-2 sm:bottom-2" :
            variant === 'inline' ? "right-1 bottom-1" :
              "right-1 bottom-1 sm:right-2 sm:bottom-2"
        )}>
          {/* 语音输入按钮 */}
          <button
            type="button"
            onClick={() => { if (isAsrRecording) stopAsrRecording(); else startAsrRecording(); }}
            disabled={disabled || isStreaming || isAsrProcessing}
            className={cn(
              "compact rounded-md p-1 sm:p-1.5 md:p-2 transition-colors touch-manipulation",
              "disabled:pointer-events-none disabled:opacity-50",
              isAsrRecording
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isAsrProcessing && "cursor-wait"
            )}
            title={isAsrRecording ? "停止语音输入" : (isAsrProcessing ? "正在识别..." : "语音输入")}
            aria-label={isAsrRecording ? "停止语音输入" : "语音输入"}
            aria-pressed={isAsrRecording}
          >
            {isAsrProcessing ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : isAsrRecording ? (
              <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>

          {/* 附件按钮 */}
          {modelConfig.supportsVision && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileSelect(e.target.files);
                  }
                  // Reset the input value so the same file can be selected again
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isStreaming || reachedImageLimit}
                className={cn(
                  "compact rounded-md p-1 sm:p-1.5 md:p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground touch-manipulation",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
                title="上传图片"
              >
                <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </>
          )}

          {/* 发送/停止合并按钮：根据状态自动切换 */}
          <button
            type="button"
            onClick={() => { if (showStop) { onStop?.(); } else { handleSend(); } }}
            disabled={!showStop && !canSend}
            className={cn(
              "compact rounded-md p-1 sm:p-1.5 md:p-2 transition-colors touch-manipulation",
              showStop
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : (canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground cursor-not-allowed opacity-50")
            )}
            title={showStop ? "停止" : (isEditing ? "保存并重新生成" : "发送消息 (Enter)")}
          >
            {showStop ? <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className={cn("mt-2 flex items-center justify-end gap-2", variant === 'center' && "px-1")}>
          <button
            type="button"
            onClick={() => { if (onCancelEdit) onCancelEdit(); }}
            className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="取消编辑"
          >
            取消
          </button>
        </div>
      )}

      {/* 提示信息 (行内编辑模式不显示提示信息，以免太杂乱) */}
      {variant !== 'inline' && (
        <div className={cn("mt-2 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2", variant === 'center' && "px-1")}>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          </div>
          {message.length > 0 && (
            <span className="shrink-0">{message.length} 字符</span>
          )}
        </div>
      )}
    </div>
  );
}
