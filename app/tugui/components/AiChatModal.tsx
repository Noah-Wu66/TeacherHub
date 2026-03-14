'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SeasonTheme, SolarTermData } from '../types';
import { useAuth } from '@/components/platform/auth/AuthProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

interface AiChatModalProps {
  open: boolean;
  onClose: () => void;
  theme: SeasonTheme;
  solarData: SolarTermData | null;
}

function getStorageKey(userId?: string) {
  return userId ? `tugui-chat-history:${userId}` : 'tugui-chat-history';
}

function loadHistory(storageKey: string): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveHistory(storageKey: string, messages: Message[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  } catch { /* ignore */ }
}

async function loadServerHistory(): Promise<Message[]> {
  try {
    const response = await fetch('/tugui/api/history', { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.messages) ? data.messages : [];
  } catch {
    return [];
  }
}

async function saveServerHistory(messages: Message[]) {
  try {
    await fetch('/tugui/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
  } catch {
    // ignore
  }
}

async function clearServerHistory() {
  try {
    await fetch('/tugui/api/history', { method: 'DELETE' });
  } catch {
    // ignore
  }
}

export default function AiChatModal({ open, onClose, theme, solarData }: AiChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const storageKey = getStorageKey(user?.id);

  useEffect(() => {
    let cancelled = false;
    const localMessages = loadHistory(storageKey);

    setHistoryReady(false);
    setMessages(localMessages);

    void loadServerHistory().then((serverMessages) => {
      if (cancelled) return;
      const nextMessages = serverMessages.length > 0 ? serverMessages : localMessages;
      setMessages(nextMessages);
      saveHistory(storageKey, nextMessages);
      setHistoryReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!historyReady) return;
    saveHistory(storageKey, messages);
    void saveServerHistory(messages);
  }, [historyReady, messages, storageKey]);

  // 弹窗打开时聚焦输入框
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, streamingReasoning, scrollToBottom]);

  // 发送消息
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setStreamingReasoning('');
    setIsThinking(true);

    // 构建发送给 API 的消息（只发最近 20 条，不传 reasoning）
    const apiMessages = newMessages.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // 构建当前模拟器参数上下文
    const context = solarData ? {
      date: solarData.date,
      name: solarData.name,
      solarAltitude: solarData.solarAltitude,
      shadowLength: solarData.shadowLength,
      description: solarData.description,
    } : null;

    const abort = new AbortController();
    abortRef.current = abort;

    let fullContent = '';
    let fullReasoning = '';

    try {
      const res = await fetch('/tugui/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || `请求失败 (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      fullContent = '';
      fullReasoning = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.reasoning) {
              fullReasoning += parsed.reasoning;
              setStreamingReasoning(fullReasoning);
            }
            if (parsed.content) {
              // 收到第一个 content 时，说明思考结束
              if (fullContent === '') {
                setIsThinking(false);
              }
              fullContent += parsed.content;
              setStreamingContent(fullContent);
            }
          } catch { /* ignore */ }
        }
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: fullContent || '（未收到回复）',
      };
      if (fullReasoning) {
        assistantMsg.reasoning = fullReasoning;
      }
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户手动停止，保存已有内容
        if (fullContent || fullReasoning) {
          const msg: Message = { role: 'assistant', content: fullContent || '（已停止）' };
          if (fullReasoning) msg.reasoning = fullReasoning;
          setMessages(prev => [...prev, msg]);
        }
        return;
      }
      const errorMsg = err instanceof Error ? err.message : '发生未知错误';
      setMessages(prev => [...prev, { role: 'assistant', content: `抱歉，出了点问题：${errorMsg}` }]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      setStreamingReasoning('');
      setIsThinking(false);
      abortRef.current = null;
    }
  };

  // 停止输出
  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  // 清除对话
  const clearChat = () => {
    if (isLoading) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setStreamingContent('');
    setStreamingReasoning('');
    setIsLoading(false);
    setIsThinking(false);
    localStorage.removeItem(storageKey);
    void clearServerHistory();
  };

  // 按键处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const hasMessages = messages.length > 0 || streamingContent || streamingReasoning;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
         onClick={onClose}>
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm ai-chat-backdrop" />

      {/* 弹窗主体 */}
      <div className="ai-chat-modal relative w-full max-w-lg h-[85vh] sm:h-[70vh] flex flex-col rounded-lg overflow-hidden"
           style={{
             background: 'rgba(255, 253, 248, 0.95)',
             border: `1px solid ${theme.borderColor}`,
             boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 2px 8px ${theme.accent}20`,
           }}
           onClick={e => e.stopPropagation()}>

        {/* 四角装饰 */}
        <div className="absolute top-2 left-2 w-3 h-3 sm:w-4 sm:h-4 border-t-[1.5px] border-l-[1.5px] opacity-40"
             style={{ borderColor: theme.accent }} />
        <div className="absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 border-t-[1.5px] border-r-[1.5px] opacity-40"
             style={{ borderColor: theme.accent }} />
        <div className="absolute bottom-2 left-2 w-3 h-3 sm:w-4 sm:h-4 border-b-[1.5px] border-l-[1.5px] opacity-40"
             style={{ borderColor: theme.accent }} />
        <div className="absolute bottom-2 right-2 w-3 h-3 sm:w-4 sm:h-4 border-b-[1.5px] border-r-[1.5px] opacity-40"
             style={{ borderColor: theme.accent }} />

        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
             style={{ borderBottom: `1px solid ${theme.borderColor}40` }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shrink-0"
                  style={{ background: theme.accent }}>
              问
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-serif leading-tight" style={{ color: theme.textPrimary }}>
                AI 解读 · 土圭之法
              </h3>
              <p className="text-[10px] font-kai leading-tight mt-0.5 opacity-40" style={{ color: theme.textPrimary }}>
                AI也可能会犯错，请核查重要信息。
              </p>
            </div>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  style={{ color: theme.textPrimary }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 ai-chat-messages">
          {!hasMessages && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg mb-3"
                   style={{ background: theme.accentLight, color: theme.accent }}>
                圭
              </div>
              <p className="text-sm font-serif mb-1" style={{ color: theme.textPrimary }}>
                小朋友，你好呀！
              </p>
              <p className="text-xs font-kai opacity-60" style={{ color: theme.textPrimary }}>
                我是古代天文学者，可以为你解读土圭之法的奥秘
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['什么是土圭？', '为什么冬天影子长？', '二十四节气是怎么来的？'].map(q => (
                  <button key={q}
                          onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                          className="text-xs px-3 py-1.5 rounded-full font-kai transition-colors"
                          style={{
                            background: theme.accentLight + '60',
                            color: theme.accent,
                            border: `1px solid ${theme.borderColor}40`,
                          }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                {/* AI 消息的思考过程（已完成的，默认折叠） */}
                {msg.role === 'assistant' && msg.reasoning && (
                  <ThinkingBlock reasoning={msg.reasoning} theme={theme} defaultOpen={false} />
                )}
                {/* 消息正文 */}
                <div className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-kai leading-relaxed ai-chat-bubble ${
                  msg.role === 'user' ? 'ai-chat-bubble-user' : 'ai-chat-bubble-ai'
                }`}
                     style={msg.role === 'user' ? {
                       background: theme.accent,
                       color: '#fff',
                     } : {
                       background: theme.accentLight + '60',
                       color: theme.textPrimary,
                       border: `1px solid ${theme.borderColor}30`,
                     }}>
                  <MessageContent content={msg.content} />
                </div>
              </div>
            </div>
          ))}

          {/* 流式输出中：思考过程 + 正文 */}
          {(streamingReasoning || streamingContent) && (
            <div className="mb-3 flex justify-start">
              <div className="max-w-[85%]">
                {/* 思考中：自动展开 */}
                {streamingReasoning && (
                  <ThinkingBlock reasoning={streamingReasoning} theme={theme} defaultOpen={true} streaming={isThinking} />
                )}
                {/* 正文流式输出 */}
                {streamingContent ? (
                  <div className="rounded-lg px-3 py-2 text-xs sm:text-sm font-kai leading-relaxed ai-chat-bubble ai-chat-bubble-ai"
                       style={{
                         background: theme.accentLight + '60',
                         color: theme.textPrimary,
                         border: `1px solid ${theme.borderColor}30`,
                       }}>
                    <MessageContent content={streamingContent} />
                    <span className="ai-chat-cursor" style={{ background: theme.accent }} />
                  </div>
                ) : isThinking ? (
                  /* 还在思考中，正文还没开始 - 不额外显示等待圆点 */
                  null
                ) : null}
              </div>
            </div>
          )}

          {/* 最初等待（还没收到任何流数据） */}
          {isLoading && !streamingReasoning && !streamingContent && (
            <div className="mb-3 flex justify-start">
              <div className="rounded-lg px-3 py-2 ai-chat-bubble ai-chat-bubble-ai"
                   style={{
                     background: theme.accentLight + '60',
                     border: `1px solid ${theme.borderColor}30`,
                   }}>
                <div className="flex gap-1 items-center py-1">
                  <span className="ai-chat-dot" style={{ background: theme.accent }} />
                  <span className="ai-chat-dot" style={{ background: theme.accent, animationDelay: '0.15s' }} />
                  <span className="ai-chat-dot" style={{ background: theme.accent, animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="shrink-0 px-3 sm:px-4 pb-3 pt-2"
             style={{ borderTop: `1px solid ${theme.borderColor}40` }}>
          <div className="flex items-center gap-2">
            {/* 清除按钮 */}
            <button onClick={clearChat}
                    title="清除对话"
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                    style={{ color: theme.accent + '90' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h12M5.5 4V2.5h5V4M3.5 4v9a1 1 0 001 1h7a1 1 0 001-1V4M6.5 7v4M9.5 7v4" />
              </svg>
            </button>

            {/* 输入框 */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="问问古人关于土圭的事..."
                rows={1}
                className="w-full resize-none rounded-lg px-3 py-2 text-xs sm:text-sm font-kai outline-none transition-colors"
                style={{
                  background: theme.accentLight + '40',
                  color: theme.textPrimary,
                  border: `1px solid ${theme.borderColor}60`,
                  maxHeight: '80px',
                }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 80) + 'px';
                }}
              />
            </div>

            {/* 发送/停止按钮 */}
            {isLoading ? (
              <button onClick={stopGeneration}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: theme.accent, color: '#fff' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="2" width="10" height="10" rx="1.5" />
                </svg>
              </button>
            ) : (
              <button onClick={sendMessage}
                      disabled={!input.trim()}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                      style={{
                        background: input.trim() ? theme.accent : theme.accentLight,
                        color: input.trim() ? '#fff' : theme.accent + '60',
                      }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.5 2.1a.5.5 0 01.7-.4l10.5 5.5a.5.5 0 010 .9L3.2 13.6a.5.5 0 01-.7-.5l1-4.6h4a.5.5 0 000-1h-4l-1-4.4z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* 思考过程折叠块 */
function ThinkingBlock({ reasoning, theme, defaultOpen, streaming }: {
  reasoning: string;
  theme: SeasonTheme;
  defaultOpen: boolean;
  streaming?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  // 流式结束时（streaming 从 true 变为 false），自动折叠
  const prevStreaming = useRef(streaming);
  useEffect(() => {
    if (prevStreaming.current === true && streaming === false) {
      setIsOpen(false);
    }
    prevStreaming.current = streaming;
  }, [streaming]);

  return (
    <div className="mb-1.5 ai-thinking-block rounded-lg overflow-hidden"
         style={{
           background: `${theme.accent}08`,
           border: `1px dashed ${theme.accent}30`,
         }}>
      {/* 标题栏 - 可点击展开/折叠 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left transition-colors hover:bg-black/[0.02]"
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', opacity: 0.8 }}
        >
          <path d="M3 1.5L7 5L3 8.5" />
        </svg>
        <span className="text-[10px] sm:text-xs font-serif" style={{ color: theme.accent, opacity: 0.85 }}>
          {streaming ? '思考中...' : '思考过程'}
        </span>
        {streaming && (
          <span className="ai-thinking-indicator" style={{ background: theme.accent }} />
        )}
      </button>

      {/* 折叠内容 */}
      <div
        ref={contentRef}
        className="ai-thinking-content"
        style={{
          maxHeight: isOpen ? '150px' : '0px',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <div className="px-2.5 pb-2 overflow-y-auto" style={{ maxHeight: '140px' }}>
          <p className="text-[10px] sm:text-[11px] leading-relaxed font-kai ai-thinking-text"
             style={{ color: theme.textPrimary, opacity: 0.75 }}>
            <MessageContent content={reasoning} />
            {streaming && <span className="ai-chat-cursor" style={{ background: theme.accent, opacity: 0.6 }} />}
          </p>
        </div>
      </div>
    </div>
  );
}

/* 消息内容渲染 - 支持换行 */
function MessageContent({ content }: { content: string }) {
  return (
    <>
      {content.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
