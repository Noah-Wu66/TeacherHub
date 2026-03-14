'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { User, GraduationCap, Copy, Pencil, RefreshCw, Globe, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/lib/ai-education/types';
import { copyToClipboard, cn } from '@/utils/ai-education/helpers';
import LoadingSpinner from './LoadingSpinner';
import PreviewModal from './PreviewModal';
import CitationModal from './CitationModal';
import MessageInput from './MessageInput';
import { parseBlobUri } from '@/lib/ai-education/blobAssetUtils';

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  reasoningContent?: string;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
  onRegenerateAssistant?: (assistantMessage: Message) => void;
  // 行内编辑支持
  editingMessageId?: string | null;
  onConfirmEdit?: (content: string, images?: string[]) => void;
  onCancelEdit?: () => void;
}

export default function MessageList({
  messages,
  isStreaming,
  streamingContent,
  reasoningContent,
  onEditMessage,
  onDeleteMessage,
  onRegenerateAssistant,
  editingMessageId,
  onConfirmEdit,
  onCancelEdit,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const streamingReasoningContainerRef = useRef<HTMLDivElement | null>(null);
  const prevStreamingContentRef = useRef<string>('');
  const prevReasoningContentRef = useRef<string>('');
  const prevMessageCountRef = useRef<number>(0);
  const userScrolledUpRef = useRef<boolean>(false);
  const lastScrollTopRef = useRef<number>(0);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');

  const [streamingReasoningExpanded, setStreamingReasoningExpanded] = useState(true);
  const [citationModalMessageId, setCitationModalMessageId] = useState<string | null>(null);

  // 检测用户是否手动向上滚动
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      // 如果用户向上滚动（scrollTop 减小且不在底部），标记为手动滚动
      if (scrollTop < lastScrollTopRef.current && !isAtBottom) {
        userScrolledUpRef.current = true;
      }
      // 如果用户滚动到底部，重置标记
      if (isAtBottom) {
        userScrolledUpRef.current = false;
      }
      lastScrollTopRef.current = scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 滚动到底部的辅助函数（使用 scrollTo 而非 scrollIntoView，避免移动端页面被拉到顶部）
  const scrollToBottom = (smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // 自动滚动到底部（仅在新消息添加时，不在消息更新时）
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    // 只在消息数量增加时滚动（新消息添加）
    if (!editingMessageId && currentCount > prevCount && !userScrolledUpRef.current) {
      scrollToBottom();
    }

    prevMessageCountRef.current = currentCount;

  }, [messages, editingMessageId]);

  // 当推理结束并开始输出正文时，自动折叠流式推理面板
  // 同时：如果在折叠状态下推理内容再次增长（例如联网搜索后继续思考），则自动重新展开
  useEffect(() => {
    const prevContent = prevStreamingContentRef.current;
    const currentContent = streamingContent || '';
    const prevReasoning = prevReasoningContentRef.current;
    const currentReasoning = reasoningContent || '';

    const hasReasoning = !!currentReasoning;

    // 只有当推理内容不再增长(推理已结束)且正文开始输出时才折叠
    if (
      hasReasoning &&
      streamingReasoningExpanded &&
      !prevContent &&
      currentContent &&
      prevReasoning === currentReasoning
    ) {
      setStreamingReasoningExpanded(false);
    }

    // 折叠状态下，如果推理内容再次增长（例如搜索阶段后的第二段思考），自动重新展开
    if (
      hasReasoning &&
      !streamingReasoningExpanded &&
      currentReasoning !== prevReasoning
    ) {
      setStreamingReasoningExpanded(true);
    }

    prevStreamingContentRef.current = currentContent;
    prevReasoningContentRef.current = currentReasoning;
  }, [streamingContent, reasoningContent, streamingReasoningExpanded]);

  // 每次开始新的流式对话时，重置推理面板为展开状态，并重置用户滚动标记
  useEffect(() => {
    if (isStreaming) {
      setStreamingReasoningExpanded(true);
      prevStreamingContentRef.current = '';
      prevReasoningContentRef.current = '';
      userScrolledUpRef.current = false; // 新对话开始时重置
    }
  }, [isStreaming]);

  // 推理内容或正文流式更新时，自动滚动到底部（尊重用户手动滚动）
  useEffect(() => {
    if (!isStreaming) return;
    if (!reasoningContent && !streamingContent) return;

    // 如果用户没有手动向上滚动，则自动滚动到底部
    if (!userScrolledUpRef.current) {
      scrollToBottom();
    }

    // 推理面板内部滚动
    if (streamingReasoningExpanded && reasoningContent) {
      const container = streamingReasoningContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [reasoningContent, streamingContent, streamingReasoningExpanded, isStreaming]);

  const handleCopy = async (content: string) => {
    await copyToClipboard(content);
  };

  // 获取favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return '';
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
  const resolveImageSrc = (image?: string) => {
    if (!image) return '';
    const blobPath = parseBlobUri(image);
    if (blobPath) {
      return `/ai-education/api/blob/read?path=${encodeURIComponent(blobPath)}`;
    }
    // 如果不是 Blob URI，直接返回（可能是外部 URL）
    return image;
  };
  // 统一 LaTeX 分隔符，支持 \( ... \)/\[ ... \] 语法
  const prepareMarkdown = (text?: string) => {
    if (!text) return '';
    return text
      .replace(/\\\(([\\s\\S]*?)\\\)/g, (_m, p1) => `$${p1}$`)
      .replace(/\\\[([\\s\\S]*?)\\\]/g, (_m, p1) => `$$${p1}$$`);
  };



  // 渲染代码块
  const renderCode = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (!inline && language) {
      return (
        <div className="relative">
          <div className="flex items-center justify-between rounded-t-md bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">{language}</span>
            <button
              onClick={() => handleCopy(String(children).replace(/\n$/, ''))}
              className="text-muted-foreground hover:text-foreground"
              title="复制代码"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="!mt-0 !rounded-t-none"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  // 渲染消息
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isEditing = editingMessageId === message.id;

    return (
      <div
        key={message.id}
        className={cn(
          "chat-message flex gap-2 sm:gap-3 p-3 sm:p-4",
          isUser && "flex-row-reverse bg-muted/30",
          isSystem && "bg-accent/50",
          isEditing && "bg-muted/50" // 编辑模式高亮背景
        )}
      >
        {/* 头像 */}
        <div className={cn(
          "flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? <User className="h-3 w-3 sm:h-4 sm:w-4" /> : <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />}
        </div>

        {/* 消息内容 */}
        <div className="flex-1 space-y-2">
          {/* 消息头部 */}
          <div className={cn(
            "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap",
            isUser && "flex-row-reverse"
          )}>
            <span className="font-medium">
              {isUser ? '你' : isSystem ? '系统' : 'AI教师'}
            </span>
          </div>

          {/* 编辑模式：替换正文和媒体为输入框 */}
          {isEditing ? (
            <div className="w-full">
              <MessageInput
                variant="inline"
                initialValue={message.content}
                initialImages={message.images}
                isEditing={true}
                onSendMessage={(content, images) => {
                  if (onConfirmEdit) {
                    onConfirmEdit(content, images);
                  }
                }}
                onCancelEdit={onCancelEdit}
                autoFocus
              />
            </div>
          ) : (
            <>
              {/* 图片和视频 */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {message.images.map((image, imgIndex) => {
                    const displayImage = resolveImageSrc(image);
                    const isVideo = displayImage.endsWith('.mp4') || displayImage.includes('.mp4?') || displayImage.includes('/video/') || displayImage.includes('type=video');

                    if (isVideo) {
                      return (
                        <button
                          key={imgIndex}
                          className="group relative overflow-hidden rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
                          onClick={() => {
                            setPreviewSrc(displayImage);
                            setPreviewType('video');
                          }}
                          title="点击预览视频"
                        >
                          <video
                            src={displayImage}
                            className="h-32 w-auto sm:h-40 object-cover rounded-lg"
                            preload="metadata"
                            muted
                          >
                            您的浏览器不支持视频播放
                          </video>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="rounded-full bg-white/90 p-2 sm:p-3">
                              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      );
                    }

                    return (
                      <div key={imgIndex} className="relative">
                        <button
                          className="group relative overflow-hidden rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
                          onClick={() => {
                            setPreviewSrc(displayImage);
                            setPreviewType('image');
                          }}
                          title="点击预览大图"
                        >
                          <Image
                            src={displayImage}
                            alt={`消息图片 ${imgIndex + 1}`}
                            width={192}
                            height={192}
                            className="h-32 sm:h-48 max-h-48 sm:max-h-72 w-auto max-w-full object-contain"
                            unoptimized
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}


              {/* 函数调用 */}
              {message.functionCall && (
                <div className="function-call">
                  <div className="font-medium text-sm">函数调用: {message.functionCall.name}</div>
                  <pre className="mt-1 text-xs sm:text-sm overflow-x-auto">
                    {message.functionCall.arguments}
                  </pre>
                  {message.functionResult && (
                    <div className="function-result">
                      <div className="font-medium text-sm">执行结果:</div>
                      <div className="mt-1 text-xs sm:text-sm">{message.functionResult.result}</div>
                    </div>
                  )}
                </div>
              )}

              {/* 消息正文 */}
              <div className={cn(
                "message-content",
                isUser && "text-right"
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code: renderCode,
                    pre: ({ children }) => <div>{children}</div>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {prepareMarkdown(message.content)}
                </ReactMarkdown>
              </div>

              {/* 元数据：Token使用量 */}
              {!isUser && message.metadata?.tokensUsed && (
                <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="opacity-70">📊 Token: {message.metadata.tokensUsed.toLocaleString()}</span>
                </div>
              )}

              {/* 用户消息操作：编辑 + 删除 + 复制 */}
              {isUser && (
                <div className={cn("mt-1 flex items-center gap-1 sm:gap-2 text-muted-foreground text-[10px] flex-wrap", isUser && "justify-end")}>
                  <button
                    onClick={() => onDeleteMessage && onDeleteMessage(message)}
                    className="icon-btn-sm rounded-full border p-1 sm:p-0.5 hover:bg-accent hover:text-accent-foreground hover:text-red-500 touch-manipulation"
                    title="删除此条及后续AI回复"
                    aria-label="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5" />
                  </button>
                  <button
                    onClick={() => onEditMessage && onEditMessage(message)}
                    className="icon-btn-sm rounded-full border p-1 sm:p-0.5 hover:bg-accent hover:text-accent-foreground touch-manipulation"
                    title="编辑并重新生成"
                    aria-label="编辑"
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(message.content)}
                    className="icon-btn-sm rounded-full border p-1 sm:p-0.5 hover:bg-accent hover:text-accent-foreground touch-manipulation"
                    title="复制"
                    aria-label="复制"
                  >
                    <Copy className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* 助手消息操作：搜索来源胶囊 + 重新回答 + 复制 */}
          {!isUser && !isEditing && (
            <div className="mt-1 flex items-center gap-1 sm:gap-2 text-muted-foreground text-[10px] flex-wrap">
              {/* 搜索来源胶囊 */}
              {message.metadata?.citations && message.metadata.citations.length > 0 && (
                <div className="flex items-center gap-1">
                  {message.metadata.citations.slice(0, 3).map((citation: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCitationModalMessageId(message.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 hover:bg-accent transition-colors group"
                      title={`来源: ${getDomain(citation.url)}`}
                    >
                      <Image
                        src={getFaviconUrl(citation.url)}
                        alt=""
                        width={12}
                        height={12}
                        className="w-3 h-3 rounded"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const globe = target.nextElementSibling as HTMLElement;
                          if (globe) globe.style.display = 'block';
                        }}
                      />
                      <Globe className="w-3 h-3 hidden" />
                      <span className="text-[10px] max-w-[60px] sm:max-w-[100px] truncate">
                        {getDomain(citation.url)}
                      </span>
                    </button>
                  ))}
                  {message.metadata.citations.length > 3 && (
                    <button
                      onClick={() => setCitationModalMessageId(message.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 hover:bg-accent transition-colors text-[10px]"
                      title="查看所有来源"
                    >
                      +{message.metadata.citations.length - 3}
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => onDeleteMessage && onDeleteMessage(message)}
                className="icon-btn-sm rounded-full border p-1 sm:p-0.5 hover:bg-accent hover:text-accent-foreground hover:text-red-500 touch-manipulation"
                title="删除此条回复"
                aria-label="删除"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5" />
              </button>
              <button
                onClick={() => onRegenerateAssistant && onRegenerateAssistant(message)}
                disabled={!!isStreaming}
                className="icon-btn-sm rounded-full border p-1 sm:p-0.5 hover:bg-accent hover:text-accent-foreground touch-manipulation disabled:pointer-events-none disabled:opacity-50"
                title="重新回答"
                aria-label="重新回答"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5" />
              </button>
              <button
                onClick={() => handleCopy(message.content)}
                className="icon-btn-sm rounded-full border p-1 sm:p-0.5 hover:bg-accent hover:text-accent-foreground touch-manipulation"
                title="复制"
                aria-label="复制"
              >
                <Copy className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin touch-scroll">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center">
          <div className="space-y-4">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">开始新对话</h3>
              <p className="text-muted-foreground">在下方输入框中输入内容即可开始</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="group">
          {messages.map(renderMessage)}

          {previewSrc && previewType && (
            <PreviewModal
              src={previewSrc}
              type={previewType}
              onClose={() => setPreviewSrc(null)}
            />
          )}

          {/* Citation Modal */}
          {citationModalMessageId && (() => {
            const msg = messages.find(m => m.id === citationModalMessageId);
            if (!msg?.metadata?.citations) return null;
            return (
              <CitationModal
                citations={msg.metadata.citations}
                searchQuery={msg.metadata.searchQuery}
                onClose={() => setCitationModalMessageId(null)}
              />
            );
          })()}

          {/* 等待模型响应时的占位加载 */}
          {isStreaming && !(streamingContent || reasoningContent) && (
            <div className="chat-message flex gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium">AI教师</span>
                  <span className="loading-dots">AI正在生成中</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  <span className="text-xs sm:text-sm">生成中</span>
                </div>
              </div>
            </div>
          )}

          {/* 流式输出 */}
          {isStreaming && (streamingContent || reasoningContent) && (
            <div className="chat-message flex gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium">AI教师</span>
                  <span className="loading-dots">正在回复</span>
                </div>


                {/* 正文内容 */}
                <div className="message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code: renderCode,
                      pre: ({ children }) => <div>{children}</div>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {prepareMarkdown(streamingContent || "")}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
