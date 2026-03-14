// Gemini 3 Flash Preview API Route - 多模态文本生成
import { getCollection } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, CONVERSATION_FIELDS } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';
import { incrementUsageCount } from '@/lib/ai-education/server/usageStats';
import { buildSystemPrompt } from './prompts';
import { parseBlobUri } from '@/lib/ai-education/blobAssetUtils';
import { head } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL_NAME = 'gemini-3-flash-preview';

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

  // 推理模式和联网检索强制开启
  const thinkingEnabled = true;
  const webSearchEnabled = true;

  const conversations = await getCollection(COLLECTIONS.conversations);
  const userId = user._id?.toString?.() ?? String(user._id);
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2);

  // 记录使用次数（含重试/再生成）
  const modelToCount = typeof model === 'string' && model ? model : 'gemini-3-flash-preview';
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

  // 构建 Gemini 格式的消息数组
  async function buildGeminiContents(src: string | any[]): Promise<any[]> {
    const contents: any[] = [];

    // 添加历史消息
    for (const msg of historyBase) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const parts: any[] = [];

        // 添加文本内容
        if (msg.content) {
          parts.push({ text: msg.content });
        }

        // 添加图片内容（用户消息可能有图片）
        if (msg.role === 'user' && Array.isArray(msg.images)) {
          for (const imgUrl of msg.images) {
            if (typeof imgUrl === 'string' && imgUrl.startsWith('data:')) {
              try {
                const comma = imgUrl.indexOf(',');
                const meta = imgUrl.slice(5, comma);
                const [mimeType] = meta.split(';');
                const data = imgUrl.slice(comma + 1);
                parts.push({
                  inlineData: { mimeType, data },
                });
              } catch {
                // 忽略解析失败的图片
              }
            } else if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
              parts.push({ fileData: { fileUri: imgUrl } });
            } else if (typeof imgUrl === 'string') {
              const blobPath = parseBlobUri(imgUrl);
              if (blobPath) {
                try {
                  const meta: any = await head(blobPath);
                  const blobUrl: string | undefined = typeof meta?.url === 'string' ? meta.url : undefined;
                  if (blobUrl) {
                    parts.push({ fileData: { fileUri: blobUrl } });
                  }
                } catch {
                  // ignore
                }
              }
            }
          }
        }

        if (parts.length > 0) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts
          });
        }
      }
    }

    // 检查是否需要添加当前消息
    const lastMsg = contents[contents.length - 1];
    const isLastMsgUser = lastMsg?.role === 'user';
    const shouldAddInput = !regenerate || !isLastMsgUser;

    if (shouldAddInput) {
      const currentParts: any[] = [];

      // 当前用户消息
      if (typeof src === 'string') {
        currentParts.push({ text: src });
      } else if (Array.isArray(src)) {
        const userMsg = src.find((i: any) => i?.role === 'user');
        if (userMsg) {
          if (Array.isArray(userMsg.content)) {
            // 处理文本
            const textPart = userMsg.content.find((c: any) => c.type === 'input_text' || c.type === 'text');
            if (textPart) {
              currentParts.push({ text: textPart.text || '' });
            }
            // 处理图片
            const imageParts = userMsg.content.filter((c: any) => c.type === 'input_image');
            for (const imgPart of imageParts) {
              const imgUrl = imgPart.image_url;
              if (typeof imgUrl === 'string' && imgUrl.startsWith('data:')) {
                try {
                  const comma = imgUrl.indexOf(',');
                  const meta = imgUrl.slice(5, comma);
                  const [mimeType] = meta.split(';');
                  const data = imgUrl.slice(comma + 1);
                  currentParts.push({
                    inlineData: { mimeType, data },
                  });
                } catch {
                  // 忽略解析失败的图片
                }
              } else if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                // YouTube URL 或其他文件 URL
                currentParts.push({ fileData: { fileUri: imgUrl } });
              } else if (typeof imgUrl === 'string') {
                const blobPath = parseBlobUri(imgUrl);
                if (blobPath) {
                  try {
                    const meta: any = await head(blobPath);
                    const blobUrl: string | undefined = typeof meta?.url === 'string' ? meta.url : undefined;
                    if (blobUrl) {
                      currentParts.push({ fileData: { fileUri: blobUrl } });
                    }
                  } catch {
                    // ignore
                  }
                }
              }
            }
          } else if (typeof userMsg.content === 'string') {
            currentParts.push({ text: userMsg.content });
          }
        }
      }

      if (currentParts.length > 0) {
        contents.push({ role: 'user', parts: currentParts });
      }
    }

    return contents;
  }

  if (stream) {
    const encoder = new TextEncoder();
    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', requestId, route: 'gemini-3-flash-preview', model: MODEL_NAME })}\n\n`)
          );

          // 构建消息数组
          const contents = await buildGeminiContents(input);

          // 确保至少有一个用户消息
          if (contents.length === 0) {
            contents.push({ role: 'user', parts: [{ text: '你好' }] });
          }

          // 构建 Gemini API 请求
          const apiKey = process.env.AIHUBMIX_API_KEY;
          if (!apiKey) {
            throw new Error('Missing AIHUBMIX_API_KEY');
          }

          // 判断用户角色
          const userRole = (user as any).role || 'user';

          // 系统提示词（按角色动态）+ 通话模式追加约束
          const finalSystemPrompt = buildSystemPrompt(userRole, voiceMode);

          // 构建请求体
          const requestBody: any = {
            systemInstruction: {
              parts: [{ text: finalSystemPrompt }]
            },
            contents,
            generationConfig: {
              responseMimeType: 'text/plain',
            },
          };

          // 添加 thinkingConfig（动态思考）- 通话模式使用 minimal
          if (thinkingEnabled) {
            requestBody.generationConfig.thinkingConfig = {
              thinkingLevel: voiceMode ? "minimal" : "high",
            };
          }

          // 添加联网检索工具
          if (webSearchEnabled) {
            requestBody.tools = [{ googleSearch: {} }];
          }

          const url = `https://aihubmix.com/gemini/v1beta/models/${encodeURIComponent(MODEL_NAME)}:streamGenerateContent?alt=sse`;

          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(requestBody),
          });

          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`Gemini API error: ${resp.status} - ${text}`);
          }

          let fullContent = '';
          let fullReasoning = '';
          const citations: any[] = [];

          // 读取流式响应
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

            // 解析 SSE 数据
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const data = JSON.parse(jsonStr);
                const candidate = data?.candidates?.[0];
                if (!candidate?.content?.parts) continue;

                for (const part of candidate.content.parts) {
                  if (part.thought && part.text) {
                    // 推理内容
                    fullReasoning += part.text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', content: part.text })}\n\n`)
                    );
                  } else if (part.text) {
                    // 最终答案内容
                    fullContent += part.text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', content: part.text })}\n\n`)
                    );
                  }
                }

                // 处理联网检索返回的引用信息
                const groundingMeta = candidate?.groundingMetadata;
                if (groundingMeta?.groundingChunks && Array.isArray(groundingMeta.groundingChunks)) {
                  for (const chunk of groundingMeta.groundingChunks) {
                    if (chunk.web?.uri && chunk.web?.title) {
                      const exists = citations.some(c => c.url === chunk.web.uri);
                      if (!exists) {
                        citations.push({
                          type: 'web_search_result_location',
                          url: chunk.web.uri,
                          title: chunk.web.title,
                          cited_text: '',
                        });
                      }
                    }
                  }
                  // 发送 citations 事件
                  if (citations.length > 0) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`)
                    );
                  }
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
                const candidate = data?.candidates?.[0];
                if (!candidate?.content?.parts) continue;

                for (const part of candidate.content.parts) {
                  if (part.thought && part.text) {
                    fullReasoning += part.text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', content: part.text })}\n\n`)
                    );
                  } else if (part.text) {
                    fullContent += part.text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', content: part.text })}\n\n`)
                    );
                  }
                }

                // 处理联网检索返回的引用信息
                const groundingMeta = candidate?.groundingMetadata;
                if (groundingMeta?.groundingChunks && Array.isArray(groundingMeta.groundingChunks)) {
                  for (const chunk of groundingMeta.groundingChunks) {
                    if (chunk.web?.uri && chunk.web?.title) {
                      const exists = citations.some(c => c.url === chunk.web.uri);
                      if (!exists) {
                        citations.push({
                          type: 'web_search_result_location',
                          url: chunk.web.uri,
                          title: chunk.web.title,
                          cited_text: '',
                        });
                      }
                    }
                  }
                  // 发送 citations 事件
                  if (citations.length > 0) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`)
                    );
                  }
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
                        citations: citations.length > 0 ? citations : undefined,
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

