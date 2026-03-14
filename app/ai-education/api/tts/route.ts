// MiniMax TTS API Route - 文本转语音
import { requireUser } from '@/lib/ai-education/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTS_API_URL = 'https://api-uw.minimax.io/v1/t2a_v2';
const VOICE_ID = 'moss_audio_0f80db41-cce7-11f0-93d8-0a04a279f0ba';

export async function POST(req: Request) {
    // 验证用户登录
    const user = await requireUser();
    if (!user) {
        return new Response(
            JSON.stringify({ error: '请先登录' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }

    const body = await req.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== 'string') {
        return new Response(
            JSON.stringify({ error: '缺少文本内容' }),
            { status: 400, headers: { 'content-type': 'application/json' } }
        );
    }

    // 限制文本长度
    const trimmedText = text.slice(0, 5000);

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: '缺少 MiniMax API Key 配置' }),
            { status: 500, headers: { 'content-type': 'application/json' } }
        );
    }

    try {
        const requestBody = {
            model: 'speech-2.6-turbo',
            text: trimmedText,
            stream: false,
            language_boost: 'Chinese',
            output_format: 'hex',
            voice_setting: {
                voice_id: VOICE_ID,
                speed: 1,
                vol: 1,
                pitch: 0,
            },
            audio_setting: {
                sample_rate: 24000,
                bitrate: 128000,
                format: 'mp3',
                channel: 1,
            },
        };

        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('MiniMax TTS error:', response.status, errorText);
            return new Response(
                JSON.stringify({ error: `TTS 请求失败: ${response.status}` }),
                { status: 500, headers: { 'content-type': 'application/json' } }
            );
        }

        const data = await response.json();

        if (data.base_resp?.status_code !== 0) {
            console.error('MiniMax TTS error:', data.base_resp);
            return new Response(
                JSON.stringify({ error: data.base_resp?.status_msg || 'TTS 合成失败' }),
                { status: 500, headers: { 'content-type': 'application/json' } }
            );
        }

        // 将 hex 编码的音频转换为 base64
        const hexAudio = data.data?.audio;
        if (!hexAudio) {
            return new Response(
                JSON.stringify({ error: '未收到音频数据' }),
                { status: 500, headers: { 'content-type': 'application/json' } }
            );
        }

        // Hex to Buffer to Base64
        const buffer = Buffer.from(hexAudio, 'hex');
        const base64Audio = buffer.toString('base64');

        return new Response(
            JSON.stringify({
                audio: `data:audio/mp3;base64,${base64Audio}`,
                duration: data.extra_info?.audio_length,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('TTS error:', error);
        return new Response(
            JSON.stringify({ error: error?.message || 'TTS 请求异常' }),
            { status: 500, headers: { 'content-type': 'application/json' } }
        );
    }
}
