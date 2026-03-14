// 语音识别 API - 接收音频，返回识别文本（qwen3-asr-flash）
import { requireUser } from '@/lib/ai-education/session';
import { incrementUsageCount } from '@/lib/ai-education/server/usageStats';
import { getAudioMimeType } from '@/lib/ai-education/server/audio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ASR_MODEL = 'qwen3-asr-flash';

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: '请先登录' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  const body = await req.json().catch(() => null);
  const { audio, mimeType } = (body || {}) as { audio?: string; mimeType?: string };

  if (!audio || typeof audio !== 'string') {
    return new Response(
      JSON.stringify({ error: '缺少音频数据' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
  if (!dashscopeApiKey) {
    return new Response(
      JSON.stringify({ error: '缺少阿里云 API Key 配置' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  // 记录使用量（不影响功能）
  await incrementUsageCount((user as any)?._id, 'asr');

  const audioDataUri = `data:${getAudioMimeType(mimeType || 'audio/webm')};base64,${audio}`;

  const asrBody = {
    model: ASR_MODEL,
    input: {
      messages: [
        { role: 'system', content: [{ text: '' }] },
        { role: 'user', content: [{ audio: audioDataUri }] }
      ]
    },
    parameters: {
      asr_options: {
        language: 'zh',
        enable_itn: true
      }
    }
  };

  const asrUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

  try {
    const sttResponse = await fetch(asrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dashscopeApiKey}`
      },
      body: JSON.stringify(asrBody),
    });

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text().catch(() => '');
      console.error('ASR API error:', sttResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `语音识别失败: ${sttResponse.status}` }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const sttData = await sttResponse.json();
    const text = sttData?.output?.choices?.[0]?.message?.content?.[0]?.text?.trim() || '';

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    const vercelRegion = process.env.VERCEL_REGION || 'unknown';
    console.error(`[ASR] Error in region ${vercelRegion}:`, error);
    console.error(`[ASR] Error cause:`, error?.cause);
    return new Response(
      JSON.stringify({ 
        error: error?.message || '请求异常',
        region: vercelRegion,
        errorCode: error?.cause?.code
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}


