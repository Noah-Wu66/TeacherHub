// DeepSeek Reasoner API Route - 文本生成
import { getCollection } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, CONVERSATION_FIELDS } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';
import { incrementUsageCount } from '@/lib/ai-education/server/usageStats';
import { buildSystemPrompt } from './prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL_NAME = 'deepseek-reasoner';

function extractTextFromInput(src: string | any[]): string {
  if (typeof src === 'string') {
    return src;
  }

  if (!Array.isArray(src)) {
    return '';
  }

  const userMsg = src.find((item: any) => item?.role === 'user' || Array.isArray(item?.content));
  const contentArr = Array.isArray(userMsg?.content) ? userMsg.content : [];
  const textItem = contentArr.find((c: any) => c?.type === 'input_text' || c?.type === 'text');
  return typeof textItem?.text === 'string' ? textItem.text : '';
}

export async function POST(req: Request) {
  // 验证用户登录
  const user = await requireUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: "请先登录" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  const body = await req.json();
  const { conversationId, input, model, stream, regenerate, voiceMode } = body as {
    conversationId: string;
    input: string | any[];
    model: string;
    settings: any;
    stream?: boolean;
    regenerate?: boolean;
    voiceMode?: boolean;
  };

  const conversations = await getCollection(COLLECTIONS.conversations);
  const userId = user._id?.toString?.() ?? String(user._id);
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2);

  // 记录使用次数（含重试/再生成）
  const modelToCount = typeof model === 'string' && model ? model : MODEL_NAME;
  await incrementUsageCount(user._id, modelToCount);

  // 记录用户消息（仅文本摘要记录）
  let userContent = '';
  let userImages: string[] = [];
  if (Array.isArray(input)) {
    const first = input.find((i: any) => Array.isArray(i?.content));
    const contentArr = Array.isArray(first?.content) ? first.content : [];
    const textItem = contentArr.find((c: any) => c?.type === 'input_text');
    userContent = textItem?.text || '[复合输入]';
    // 提取图片
    const imageItems = contentArr.filter((c: any) => c?.type === 'input_image');
    userImages = imageItems.map((item: any) => item.image_url).filter(Boolean);
  } else {
    userContent = input;
  }

  if (!regenerate) {
    await conversations.updateOne(
      { id: conversationId, [CONVERSATION_FIELDS.userId]: userId },
      {
        $push: {
          [CONVERSATION_FIELDS.messages]: {
            id: Date.now().toString(36),
            role: 'user',
            content: userContent,
            timestamp: new Date(),
            model,
            images: userImages.length > 0 ? userImages : undefined,
          },
        } as any,
        $set: { [CONVERSATION_FIELDS.updatedAt]: new Date() },
      }
    );
  }

  // 从数据库获取历史，构建消息
  const doc = await conversations.findOne(
    { id: conversationId, [CONVERSATION_FIELDS.userId]: userId },
    { projection: { [CONVERSATION_FIELDS.messages]: 1 } }
  );
  const fullHistory: any[] = Array.isArray((doc as any)?.[CONVERSATION_FIELDS.messages])
    ? (doc as any)[CONVERSATION_FIELDS.messages]
    : [];

  // 限制上下文长度：最多保留最近20条消息
  const MAX_CONTEXT_MESSAGES = 20;
  const historyForContext = regenerate ? fullHistory : (fullHistory.length > 0 ? fullHistory.slice(0, -1) : []);
  const historyBase = historyForContext.slice(-MAX_CONTEXT_MESSAGES);

  function buildDeepSeekMessages(src: string | any[], systemPrompt: string): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of historyBase) {
      if (msg?.role !== 'user' && msg?.role !== 'assistant') {
        continue;
      }

      const text = typeof msg?.content === 'string' ? msg.content.trim() : '';
      if (!text) {
        continue;
      }

      messages.push({
        role: msg.role,
        content: text,
      });
    }

    const inputText = extractTextFromInput(src).trim();
    const lastMessage = messages[messages.length - 1];
    const shouldAddInput = !regenerate || lastMessage?.role !== 'user';

    if (inputText) {
      if (shouldAddInput) {
        messages.push({ role: 'user', content: inputText });
      } else {
        messages[messages.length - 1] = { role: 'user', content: inputText };
      }
    }

    return messages;
  }

  if (stream) {
    const encoder = new TextEncoder();
    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', requestId, route: 'deepseek-reasoner', model: MODEL_NAME })}\n\n`)
          );

          const apiKey = process.env.DEEPSEEK_API_KEY;
          if (!apiKey) {
            throw new Error('Missing DEEPSEEK_API_KEY');
          }

          const userRole = (user as any).role || 'user';
          const finalSystemPrompt = buildSystemPrompt(userRole, voiceMode);
          const messages = buildDeepSeekMessages(input, finalSystemPrompt);
          if (messages.length === 1) {
            messages.push({ role: 'user', content: '你好' });
          }

          const requestBody = {
            model: MODEL_NAME,
            messages,
            stream: true,
            max_tokens: 65536,
          };

          const resp = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`DeepSeek API error: ${resp.status} - ${text}`);
          }

          let fullContent = '';
          let fullReasoning = '';

          const reader = resp.body?.getReader();
          if (!reader) {
            throw new Error('无法读取响应流');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const data = JSON.parse(jsonStr);
                const delta = data?.choices?.[0]?.delta;
                if (!delta) continue;

                if (delta.reasoning_content) {
                  fullReasoning += delta.reasoning_content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`)
                  );
                }

                if (delta.content) {
                  fullContent += delta.content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`)
                  );
                }
              } catch {
                // 忽略解析错误
              }
            }
          }

          // 处理剩余的 buffer
          if (buffer.trim()) {
            const remaining = buffer.split('\n');
            for (const line of remaining) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const data = JSON.parse(jsonStr);
                const delta = data?.choices?.[0]?.delta;
                if (!delta) continue;

                if (delta.reasoning_content) {
                  fullReasoning += delta.reasoning_content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`)
                  );
                }

                if (delta.content) {
                  fullContent += delta.content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`)
                  );
                }
              } catch {
                // 忽略解析错误
              }
            }
          }

          // 保存到数据库（regenerate 时由前端负责更新）
          if (!regenerate) {
            try {
              await conversations.updateOne(
                { id: conversationId, [CONVERSATION_FIELDS.userId]: userId },
                {
                  $push: {
                    [CONVERSATION_FIELDS.messages]: {
                      id: Date.now().toString(36),
                      role: 'assistant',
                      content: fullContent,
                      timestamp: new Date(),
                      model: MODEL_NAME,
                      metadata: {
                        reasoning: fullReasoning || undefined,
                      },
                    },
                  } as any,
                  $set: { [CONVERSATION_FIELDS.updatedAt]: new Date() },
                }
              );
            } catch { }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (e: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: e?.message || String(e) })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(streamBody, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Request-Id': requestId,
        'X-Model': MODEL_NAME,
      },
    });
  }

  return new Response(
    JSON.stringify({ error: '仅支持流式输出' }),
    { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'content-type': 'application/json' } }
  );
}
