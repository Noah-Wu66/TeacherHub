import { generateId, playCompletionChime } from '@/utils/ai-education/helpers';
import type { ConversationSettings, Message } from '@/lib/ai-education/types';
import type { ModelParams } from '@/lib/ai-education/modelParams';
import { apiFetch } from '@/lib/ai-education/api';

interface StreamChatContext {
  requestId: string;
  controller: AbortController;
  response: Response;
  conversationId: string;
  currentModel: string;
  settings: ConversationSettings;
  modelParams: ModelParams;
  addMessage: (message: Message, conversationId: string) => void;
  updateMessage: (
    messageId: string,
    updates: Partial<Message>,
    conversationId: string
  ) => void;
  setStreamingContent: (content: string) => void;
  setReasoningContent: (content: string) => void;
  releaseStreamingState: (requestId?: string, force?: boolean) => void;
  clearAbortController: (controller: AbortController) => void;
  abortRef: React.MutableRefObject<AbortController | null>;
  targetMessageId?: string | null; // If provided, update this message instead of adding new one
  onComplete?: (content: string) => void; // Called when stream completes with final content
}

const isAbortError = (error: any) => {
  if (!error) return false;
  if (error.name === 'AbortError') return true;
  const message = String(error?.message || '').toLowerCase();
  return message.includes('aborted') || message.includes('abort');
};

export async function streamChatResponse(ctx: StreamChatContext) {
  const {
    requestId,
    controller,
    response,
    conversationId,
    currentModel,
    settings,
    addMessage,
    updateMessage,
    setStreamingContent,

    releaseStreamingState,
    clearAbortController,
    targetMessageId,
    onComplete,
  } = ctx;

  const headerModel = response.headers.get('X-Model');
  const reader: ReadableStreamDefaultReader<Uint8Array> | undefined =
    response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('无法读取响应流');
  }

  let assistantContent = '';
  let assistantImages: string[] = [];
  let reasoning = '';
  let routedModel: string | null = headerModel || null;
  let assistantAdded = false;
  const citations: any[] = [];
  let searchQuery = '';

  let sseBuffer = '';

  while (true) {
    let done = false;
    let value: Uint8Array | undefined;
    try {
      const result = await reader.read();
      done = !!result.done;
      value = result.value;
    } catch (error: any) {
      if (isAbortError(error)) {
        break;
      }
      throw error;
    }
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const normalized = chunk.replace(/\r\n/g, '\n');
    sseBuffer += normalized;


    while (true) {
      const sepIndex = sseBuffer.indexOf('\n\n');
      if (sepIndex === -1) break;
      const block = sseBuffer.slice(0, sepIndex);
      sseBuffer = sseBuffer.slice(sepIndex + 2);

      try {
        const dataLines = block
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => {
            const after = l.slice(5);
            return after.startsWith(' ') ? after.slice(1) : after;
          });
        if (dataLines.length === 0) continue;
        const payload = dataLines.join('\n');
        const data = JSON.parse(payload);

        switch (data.type) {
          case 'content':
            assistantContent += data.content;
            if (data.citations && Array.isArray(data.citations)) {
              citations.push(...data.citations);
            }

            if (targetMessageId) {
              // If targeting a message, update it in place
              updateMessage(targetMessageId, { content: assistantContent }, conversationId);
            } else {
              // Otherwise update global streaming content
              setStreamingContent(assistantContent);
            }
            break;
          case 'citations':
            if (Array.isArray(data.citations)) {
              citations.push(...data.citations);
            }
            break;
          case 'search_start':
            break;
          case 'search_query':
            searchQuery = data.query || '';
            break;
          case 'search_complete':
            break;
          case 'images':
            if (Array.isArray(data.images)) {
              assistantImages = data.images.filter(
                (u: any) => typeof u === 'string' && u
              );
            }
            break;
          case 'debug':
            break;
          case 'reasoning':
            // 收集推理内容但不显示
            reasoning += data.content;
            // 只保存到 metadata，不流式显示
            break;
          case 'error': {
            const errorMessage =
              typeof data?.error === 'string'
                ? data.error
                : `${routedModel || currentModel || '模型'} 返回错误`;

            if (targetMessageId) {
              updateMessage(targetMessageId, { content: `❌ ${errorMessage}` }, conversationId);
            } else if (!assistantAdded) {
              const assistantMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: `❌ ${errorMessage}`,
                timestamp: new Date(),
                model: (routedModel || currentModel) as string,
              };
              addMessage(assistantMessage, conversationId);
              assistantAdded = true;
            }

            releaseStreamingState(requestId);
            try {
              if (!controller.signal.aborted) controller.abort();
            } catch {
              // ignore
            }
            clearAbortController(controller);
            return;
          }
          case 'start':
            if (data?.model && typeof data.model === 'string') {
              routedModel = data.model;
            }
            break;
          case 'tool_call_start':
            break;
          case 'function_result':
          case 'tool_result':
            assistantContent += `\n\n**工具调用结果 (${data.tool || data.function
              }):**\n${data.result}`;

            if (targetMessageId) {
              updateMessage(targetMessageId, { content: assistantContent }, conversationId);
            } else {
              setStreamingContent(assistantContent);
            }
            break;
          case 'done':
            const finalMessage: Message = {
              id: targetMessageId || generateId(),
              role: 'assistant',
              content: assistantContent,
              timestamp: new Date(),
              model: (routedModel || currentModel) as string,
              images:
                assistantImages && assistantImages.length > 0
                  ? assistantImages
                  : undefined,
              metadata: {
                reasoning: reasoning || undefined,
                citations:
                  citations.length > 0 ? citations : undefined,
                searchQuery: searchQuery || undefined,
              },
            };

            if (targetMessageId) {
              updateMessage(targetMessageId, {
                content: assistantContent,
                images: finalMessage.images,
                metadata: finalMessage.metadata,
              }, conversationId);
              // 同步更新到后端数据库
              try {
                apiFetch('/ai-education/api/conversations', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: conversationId,
                    op: 'update_message',
                    messageId: targetMessageId,
                    updates: {
                      content: assistantContent,
                      images: finalMessage.images,
                      metadata: finalMessage.metadata,
                    },
                  }),
                });
              } catch {
                // 忽略错误
              }
            } else if (!assistantAdded) {
              addMessage(finalMessage, conversationId);
              assistantAdded = true;
            }
            releaseStreamingState(requestId);
            try {
              if (settings?.sound?.onComplete !== false) {
                playCompletionChime();
              }
            } catch {
              // ignore
            }
            // Call onComplete callback if provided
            if (onComplete && assistantContent) {
              onComplete(assistantContent);
            }
            break;
          default:
          // ignore
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  // Final check if done without 'done' event or other completion
  if (
    !assistantAdded &&
    !targetMessageId && // Don't add if we were targeting an existing message
    !controller.signal.aborted &&
    (assistantContent || (assistantImages?.length ?? 0) > 0)
  ) {
    addMessage(
      {
        id: generateId(),
        role: 'assistant',
        content: assistantContent || '',
        timestamp: new Date(),
        model: (routedModel || currentModel) as string,
        images:
          assistantImages && assistantImages.length > 0
            ? assistantImages
            : undefined,
        metadata: {
          reasoning: reasoning || undefined,
          citations: citations.length > 0 ? citations : undefined,
          searchQuery: searchQuery || undefined,
        },
      } as any,
      conversationId
    );
    try {
      if (settings?.sound?.onComplete !== false) {
        playCompletionChime();
      }
    } catch {
      // ignore
    }
    // Call onComplete callback if provided
    if (onComplete && assistantContent) {
      onComplete(assistantContent);
    }
  }

  releaseStreamingState(requestId);
}
