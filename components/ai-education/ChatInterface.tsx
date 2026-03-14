'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useChatStore } from '@/store/ai-education/chatStore';
import type { Message } from '@/lib/ai-education/types';
import { generateId, generateTitleFromMessage, playCompletionChime } from '@/utils/ai-education/helpers';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { apiFetch } from '@/lib/ai-education/api';
import { upload } from '@vercel/blob/client';
import { streamChatResponse } from './chat/streamChatResponse';



type ChatInterfaceProps = {
  user: any | null;
  onOpenAccount?: () => void;
};

export default function ChatInterface({ user, onOpenAccount }: ChatInterfaceProps) {
  const {
    currentConversation,
    setCurrentConversation,
    addConversation,
    addMessage,
    updateMessage,
    insertMessage,
    updateConversation,
    deleteMessages,
    currentModel,
    settings,
    modelParams,
    isStreaming,
    setStreaming,
    setError,
    voiceMode,
  } = useChatStore();

  const [streamingContent, setStreamingContent] = useState('');
  const [reasoningContent, setReasoningContent] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const streamingRequestIdRef = useRef<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const userInitial = useMemo(() => {
    if (!user?.name || typeof user.name !== 'string') return '我';
    return user.name.charAt(0).toUpperCase();
  }, [user]);

  // 通话模式：播放语音（调用方已确保 voiceMode 为 true）
  const playVoice = useCallback(async (text: string) => {
    if (!text) return;
    try {
      const response = await apiFetch('/ai-education/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        console.error('[VoiceMode] TTS 请求失败:', response.status);
        return;
      }
      const data = await response.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.play().catch((e) => console.error('[VoiceMode] 播放失败:', e));
      } else if (data.error) {
        console.error('[VoiceMode] TTS 错误:', data.error);
      }
    } catch (e) {
      console.error('[VoiceMode] TTS 异常:', e);
    }
  }, []);

  const releaseStreamingState = useCallback(
    (requestId?: string) => {
      const targetId = requestId ?? streamingRequestIdRef.current;
      if (!targetId) return;

      const shouldRelease = streamingRequestIdRef.current === targetId;

      if (shouldRelease) {
        streamingRequestIdRef.current = null;
        setStreaming(false);
        setStreamingContent('');
        setReasoningContent('');
      }
    },
    [setStreaming, setStreamingContent, setReasoningContent]
  );

  const clearAbortController = useCallback((controller: AbortController) => {
    if (abortRef.current === controller) {
      abortRef.current = null;
    }
  }, []);


  // 发送消息（支持编辑模式：提交前会截断后续消息）
  const handleSendMessage = useCallback(async (
    content: string,
    images?: string[]
  ) => {
    const controller = new AbortController();
    const requestId = generateId();

    try {
      setError(null);
      setStreaming(true);
      setStreamingContent('');
      setReasoningContent('');

      streamingRequestIdRef.current = requestId;

      // 建立可中断控制器
      abortRef.current = controller;

      // 规范化图片：把遗留 data: 转为 Vercel Blob 公网 URL，避免请求体超限
      let normalizedImages = images;
      if (Array.isArray(images) && images.length > 0) {
        const next: string[] = [];
        for (const img of images) {
          if (typeof img === 'string' && img.startsWith('data:')) {
            try {
              const blob = await (await fetch(img)).blob();
              const ext = blob.type === 'image/webp' ? 'webp' : (blob.type === 'image/png' ? 'png' : 'jpg');
              const filename = `image_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
              const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
              const result = await upload(filename, file, {
                access: 'public',
                handleUploadUrl: '/ai-education/api/blob/upload',
              });
              next.push(result.url);
            } catch {
              // 失败则跳过该图片，避免阻塞发送
            }
          } else if (typeof img === 'string' && img) {
            next.push(img);
          }
        }
        normalizedImages = next.length > 0 ? next : undefined;
      }

      // 创建用户消息
      const userMessage = {
        id: generateId(),
        role: 'user' as const,
        content,
        timestamp: new Date(),
        model: currentModel,
        images: normalizedImages,
      };

      // 编辑场景：
      let conversationId = currentConversation?.id;
      let shouldAppendUserMessage = false;
      let targetMessageId: string | undefined = undefined;

      if (editingMessageId && conversationId) {
        // 编辑模式：更新用户消息内容，更新现有助手消息（如有）或插入新消息
        const msgs = currentConversation?.messages || [];
        const editIndex = msgs.findIndex((m: any) => m.id === editingMessageId);

        if (editIndex !== -1) {
          // 1. 更新被编辑的用户消息内容
          try {
            await apiFetch('/ai-education/api/conversations', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: conversationId,
                op: 'update_message',
                messageId: editingMessageId,
                updates: { content, images: normalizedImages },
              }),
            });
          } catch {
            // 忽略错误
          }
          updateMessage(editingMessageId, { content, images: normalizedImages }, conversationId);

          // 2. 查找或创建助手消息
          // 检查下一条消息是否为助手消息
          if (editIndex + 1 < msgs.length && msgs[editIndex + 1].role === 'assistant') {
            const existingAssistantMsgId = msgs[editIndex + 1].id;
            // 找到现有助手消息，准备更新
            targetMessageId = existingAssistantMsgId;

            const assistantPlaceholder = '';

            try {
              apiFetch('/ai-education/api/conversations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: conversationId,
                  op: 'update_message',
                  messageId: existingAssistantMsgId,
                  updates: { content: assistantPlaceholder, images: [] },
                }),
              });
            } catch { }
            updateMessage(
              existingAssistantMsgId,
              { content: assistantPlaceholder, images: [], metadata: undefined },
              conversationId
            );
          } else {
            // 下一条不是助手消息，或者已经是最后一条
            // 需要在用户消息后面插入一条新的助手消息
            const newAssistantMsgId = generateId();
            const placeholderMsg: Message = {
              id: newAssistantMsgId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              model: currentModel,
            };
            // 插入到用户消息后面
            insertMessage(placeholderMsg, editingMessageId, conversationId);
            // 同步到后端
            try {
              apiFetch('/ai-education/api/conversations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: conversationId,
                  op: 'insert_message_after',
                  afterMessageId: editingMessageId,
                  message: placeholderMsg,
                }),
              });
            } catch { }
            targetMessageId = newAssistantMsgId;
          }

          setEditingMessageId(null);
        }
      } else {
        // 非编辑模式（新消息）
        if (!conversationId || currentConversation?.model !== currentModel) {
          const title = generateTitleFromMessage(content);
          const response = await apiFetch('/ai-education/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              model: currentModel,
              settings,
            }),
          });
          if (!response.ok) {
            throw new Error('创建对话失败');
          }
          const newConversation = await response.json();
          const withFirstMessage = { ...newConversation, messages: [userMessage] } as any;
          setCurrentConversation(withFirstMessage);
          addConversation(withFirstMessage);
          conversationId = newConversation.id;
        } else {
          // 现有会话
          if (currentConversation && (currentConversation.messages?.length || 0) === 0) {
            const newTitle = generateTitleFromMessage(content);
            if (newTitle && newTitle !== currentConversation.title) {
              try {
                await apiFetch('/ai-education/api/conversations', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: currentConversation.id, title: newTitle }),
                });
                updateConversation(currentConversation.id, { title: newTitle });
                setCurrentConversation({ ...currentConversation, title: newTitle } as any);
              } catch { }
            }
          }
          shouldAppendUserMessage = true;
        }
      }

      if (!conversationId) {
        throw new Error('无法获取会话 ID');
      }

      const requestConversationId = conversationId;

      if (shouldAppendUserMessage) {
        addMessage(userMessage, requestConversationId);
      }

      // 根据当前选择的模型动态选择 API 端点
      const apiEndpoint = `/ai-education/api/${currentModel}`;
      const toImageItem = (img: string) => {
        return { type: 'input_image', image_url: img } as any;
      };

      let input: string | any[];
      if (normalizedImages && normalizedImages.length > 0) {
        input = [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: content },
              ...normalizedImages.map(toImageItem),
            ],
          },
        ];
      } else {
        input = content;
      }

      const requestBody: any = {
        conversationId: requestConversationId,
        input,
        model: currentModel,
        settings,
        stream: true,
        modelParams,
        regenerate: !!targetMessageId,
        voiceMode,
      };

      const response = await apiFetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const status = response.status;
        let bodyText = '';
        try { bodyText = await response.text(); } catch { }
        try {
          const errorData = JSON.parse(bodyText);
          throw new Error(errorData.error || `请求失败 (${status})`);
        } catch {
          throw new Error(bodyText || `请求失败 (${status})`);
        }
      }

      const contentType = response.headers.get('Content-Type') || '';
      const canStream = contentType.includes('text/event-stream');

      if (canStream) {
        await streamChatResponse({
          requestId,
          controller,
          response,
          conversationId: requestConversationId,
          currentModel,
          settings,
          modelParams,
          addMessage,
          updateMessage,
          setStreamingContent,
          setReasoningContent,
          releaseStreamingState,
          clearAbortController,
          abortRef,
          targetMessageId,
          onComplete: voiceMode ? playVoice : undefined,
        });
      } else {
        // 处理非流式响应
        const data = await response.json();
        if (data.message) {
          if (targetMessageId) {
            updateMessage(targetMessageId, { ...data.message }, requestConversationId);
          } else {
            addMessage({
              ...data.message,
              id: generateId(),
              timestamp: new Date(),
            }, requestConversationId);
          }
          try { if (settings?.sound?.onComplete !== false) { playCompletionChime(); } } catch { }
        }
      }
    } catch (error: any) {
      const aborted = !!(
        error &&
        (error.name === 'AbortError' ||
          String(error?.message || '')
            .toLowerCase()
            .includes('abort'))
      );
      if (!aborted) {
        setError(error instanceof Error ? error.message : '发送消息失败');
      }
    } finally {
      releaseStreamingState(requestId);
      clearAbortController(controller);
    }
  }, [
    currentConversation,
    currentModel,
    settings,
    modelParams,
    setCurrentConversation,
    addConversation,
    addMessage,
    updateConversation,
    setStreaming,
    setError,
    editingMessageId,
    updateMessage,
    insertMessage,
    releaseStreamingState,
    clearAbortController,
    voiceMode,
    playVoice,
  ]);

  const handleStopStreaming = useCallback(() => {
    try {
      const controller = abortRef.current;
      if (controller && !controller.signal.aborted) {
        controller.abort();
      }
      if (controller) {
        clearAbortController(controller);
      }
    } catch { }
    releaseStreamingState();
  }, [releaseStreamingState, clearAbortController]);

  // 删除消息
  const handleDeleteMessage = useCallback(async (message: Message) => {
    if (!currentConversation) return;
    const messageIdsToDelete = [message.id];
    const msgs = currentConversation.messages;
    const index = msgs.findIndex(m => m.id === message.id);

    if (message.role === 'user' && index !== -1 && index + 1 < msgs.length) {
      const nextMsg = msgs[index + 1];
      if (nextMsg.role === 'assistant') {
        messageIdsToDelete.push(nextMsg.id);
      }
    }
    deleteMessages(messageIdsToDelete);
    try {
      await apiFetch('/ai-education/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentConversation.id,
          op: 'delete_messages',
          messageIds: messageIdsToDelete
        }),
      });
    } catch {
      setError('删除消息失败，请刷新重试');
    }
  }, [currentConversation, deleteMessages, setError]);

  const handleStartEditMessage = useCallback((message: Message) => {
    if (!currentConversation) return;
    setEditingMessageId(message.id);
  }, [currentConversation]);

  return (
    <div className="flex h-full flex-col">
      {/* 顶栏 */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-3 py-2 sm:hidden">
          <div className="flex-1" />
          <div className="flex items-center justify-end gap-2">

            {user && (
              <button
                type="button"
                onClick={() => onOpenAccount?.()}
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                title={user.name}
              >
                <span className="h-7 w-7 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                  {userInitial}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:gap-3" />
          <div className="flex-1 flex items-center justify-center px-2">
            {currentConversation?.title && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-none">{currentConversation.title}</div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">

            {user && (
              <button
                type="button"
                onClick={() => onOpenAccount?.()}
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                title={user.name}
              >
                <span className="h-8 w-8 rounded-md bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                  {userInitial}
                </span>
                <span className="hidden md:inline text-xs font-medium text-primary">个人中心</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主体区域 */}
      {(!currentConversation || currentConversation.messages.length === 0) ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 px-3 sm:px-4 md:px-6 text-center">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight inline-flex items-center gap-2">欢迎来到智趣学 <Image src="/ai-education/study.png" alt="智趣学" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 object-contain inline-block" /></h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground px-2 sm:px-4">输入问题，开启你的AI学习之旅</p>
            </div>
            <div className="w-full max-w-2xl px-2 sm:px-0">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isStreaming}
                variant="center"
                autoFocus
                onStop={handleStopStreaming}
              />
            </div>
            <div className="text-xs text-muted-foreground px-2 sm:px-4">智趣学 - 让学习更智能、更有趣</div>
          </div>
        </div>
      ) : (
        <>
          <MessageList
            messages={currentConversation?.messages || []}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            reasoningContent={reasoningContent}
            onDeleteMessage={handleDeleteMessage}
            editingMessageId={editingMessageId}
            onEditMessage={handleStartEditMessage}
            onCancelEdit={() => setEditingMessageId(null)}
            onConfirmEdit={handleSendMessage}
            onRegenerateAssistant={async (assistantMsg) => {
              if (!currentConversation) return;
              const targetConversationId = currentConversation.id;
              const controller = new AbortController();
              const requestId = generateId();
              try {
                setError(null);
                setStreaming(true);
                setStreamingContent('');
                setReasoningContent('');

                streamingRequestIdRef.current = requestId;
                abortRef.current = controller;

                const msgs = currentConversation.messages;
                const aIndex = msgs.findIndex((m: any) => m.id === assistantMsg.id);
                if (aIndex <= 0) throw new Error('No user message found');
                let userIndex = -1;
                for (let i = aIndex - 1; i >= 0; i--) {
                  if ((msgs[i] as any).role === 'user') { userIndex = i; break; }
                }
                if (userIndex === -1) throw new Error('No user message found');
                const userMsg = msgs[userIndex];

                updateMessage(
                  assistantMsg.id,
                  { content: '', images: [] },
                  targetConversationId
                );

                const apiEndpoint = `/ai-education/api/${currentModel}`;
                const toImageItem = (img: string) => ({ type: 'input_image', image_url: img } as any);

                const requestImages = Array.isArray(userMsg.images) ? userMsg.images : undefined;
                let normalizedRequestImages = requestImages;
                if (requestImages && requestImages.length > 0) {
                  const next: string[] = [];
                  for (const img of requestImages) {
                    if (typeof img === 'string' && img.startsWith('data:')) {
                      try {
                        const blob = await (await fetch(img)).blob();
                        const ext = blob.type === 'image/webp' ? 'webp' : (blob.type === 'image/png' ? 'png' : 'jpg');
                        const filename = `image_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                        const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
                        const result = await upload(filename, file, {
                          access: 'public',
                          handleUploadUrl: '/ai-education/api/blob/upload',
                        });
                        next.push(result.url);
                      } catch {
                        // ignore
                      }
                    } else if (typeof img === 'string' && img) {
                      next.push(img);
                    }
                  }
                  normalizedRequestImages = next.length > 0 ? next : undefined;
                }

                let input: string | any[];
                if (normalizedRequestImages && normalizedRequestImages.length > 0) {
                  input = [{ role: 'user', content: [{ type: 'input_text', text: userMsg.content }, ...normalizedRequestImages.map(toImageItem)] }];
                } else {
                  input = userMsg.content;
                }

                const response = await apiFetch(apiEndpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  signal: controller.signal,
                  body: JSON.stringify({
                    conversationId: targetConversationId,
                    input,
                    model: currentModel,
                    settings,
                    modelParams,
                    stream: true,
                    regenerate: true,
                  })
                });

                if (!response.ok) throw new Error('Request failed');

                const canStream = response.headers.get('Content-Type')?.includes('text/event-stream');

                if (canStream) {
                  await streamChatResponse({
                    requestId,
                    controller,
                    response,
                    conversationId: targetConversationId,
                    currentModel,
                    settings,
                    modelParams,
                    addMessage,
                    updateMessage,
                    setStreamingContent,
                    setReasoningContent,
                    releaseStreamingState,
                    clearAbortController,
                    abortRef,
                    targetMessageId: assistantMsg.id,
                  });
                } else {
                  // 处理非流式响应
                  const data = await response.json();
                  if (data.message) {
                    updateMessage(assistantMsg.id, {
                      content: data.message.content || '',
                      images: data.message.images,
                    }, targetConversationId);

                    // 同步更新到后端
                    try {
                      await apiFetch('/ai-education/api/conversations', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: targetConversationId,
                          op: 'update_message',
                          messageId: assistantMsg.id,
                          updates: {
                            content: data.message.content || '',
                            images: data.message.images,
                          },
                        }),
                      });
                    } catch {
                      // 忽略错误
                    }

                    try {
                      if (settings?.sound?.onComplete !== false) {
                        playCompletionChime();
                      }
                    } catch { }
                  }
                }
              } catch (e: any) {
                setError(e?.message || 'Failed');
              } finally {
                releaseStreamingState(requestId);
                clearAbortController(controller);
              }
            }}
          />

          <div className="border-t border-border bg-background p-2 sm:p-4 pb-safe-area-inset-bottom">
            <div className="mx-auto max-w-4xl">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isStreaming || !!editingMessageId}
                onStop={handleStopStreaming}
                placeholder={!!editingMessageId ? "正在编辑上方的消息..." : undefined}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
