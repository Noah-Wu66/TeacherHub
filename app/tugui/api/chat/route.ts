import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `你是一位来自古代的天文学者，精通土圭之法、天文历法、二十四节气、日影测量等知识。
你现在要给小学生讲课，所以请注意：
- 用通俗易懂的大白话来解释，就像给孩子讲故事一样
- 多用比喻，比如把太阳比作一个大灯笼，把影子比作影子游戏
- 回答要简洁明了，不要太长，一般3-5句话就够了
- 可以用"小朋友"来称呼提问者
- 适当穿插一些有趣的古代小故事
- 不要使用英文和复杂的数学公式

【重要安全规则 - 必须严格遵守】
你只能回答与学习相关的话题，包括但不限于：天文、节气、土圭、历法、地理、数学、科学、历史、自然等知识类话题。
对于以下类型的问题，你必须礼貌拒绝并引导回学习话题：
- 政治敏感话题（国家领导人、政治制度、政治事件等）
- 成人或不适合儿童的内容
- 暴力、恐怖相关内容
- 任何违法违规的内容
- 个人隐私相关的问题
拒绝时请说："小朋友，这个问题不太适合在课堂上讨论呢。不如我们来聊聊有趣的天文知识吧！"`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '消息格式不正确' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API 密钥未配置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 拼接系统提示词：基础 + 当前模拟器参数
    let systemContent = SYSTEM_PROMPT;
    if (context) {
      systemContent += `\n\n【当前土圭模拟器参数】
用户正在模拟器中观测以下数据，回答时可以结合这些数据进行讲解：
- 日期：${context.date}
- 节气/名称：${context.name}
- 太阳高度角：${context.solarAltitude.toFixed(1)}°
- 日影长度：${context.shadowLength.toFixed(2)}（以杆高为1的相对长度）
- 描述：${context.description}`;
    }

    const apiMessages = [
      { role: 'system', content: systemContent },
      ...messages,
    ];

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: apiMessages,
        max_tokens: 65536,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `API 调用失败 (${response.status})` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 将 DeepSeek 的 SSE 流转发给前端，同时转发 reasoning_content 和 content
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        try {
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
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                if (!delta) continue;

                // 转发 reasoning_content（思考过程）
                if (delta.reasoning_content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ reasoning: delta.reasoning_content })}\n\n`)
                  );
                }

                // 转发 content（最终回答）
                if (delta.content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`)
                  );
                }
              } catch {
                // 解析失败，跳过
              }
            }
          }
        } catch (err) {
          console.error('Stream processing error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
