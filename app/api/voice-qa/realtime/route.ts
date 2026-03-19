import type { VoiceQaTurnRequest } from "@/lib/voice-qa/types";
import {
  decodeVoiceQaAudio,
  requireVoiceQaUser,
  streamVoiceQaTurn,
  toFriendlyVoiceQaError,
} from "@/lib/voice-qa/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: Request) {
  const user = await requireVoiceQaUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "请先登录正式账号或游客账号后再使用你问我答。" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const body = (await req.json().catch(() => null)) as VoiceQaTurnRequest | null;
  const sessionId = String(body?.sessionId || "").trim();
  const turnId = String(body?.turnId || "").trim();
  const dialogId = String(body?.dialogId || "").trim();
  const systemRole = typeof body?.systemRole === "string" ? body.systemRole : undefined;
  const audio = String(body?.audio || "").trim();
  const sampleRate = Number(body?.sampleRate || 0);
  const format = String(body?.format || "").trim();
  const channelCount = Number(body?.channelCount || 0);

  if (!sessionId || !turnId || !audio || !sampleRate || !format || !channelCount) {
    return new Response(JSON.stringify({ error: "缺少必要的语音数据。" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let audioBuffer: Buffer;
  try {
    audioBuffer = decodeVoiceQaAudio({
      audioBase64: audio,
      sampleRate,
      format,
      channelCount,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: toFriendlyVoiceQaError(error) || "音频处理失败。",
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (payload: unknown) => {
        controller.enqueue(encoder.encode(sse(payload)));
      };

      try {
        await streamVoiceQaTurn({
          sessionId,
          turnId,
          dialogId,
          systemRole,
          audioBuffer,
          signal: req.signal,
          onEvent(event) {
            push(event);
          },
        });
      } catch (error) {
        console.error("[voice-qa/realtime] failed:", error);
        const message = toFriendlyVoiceQaError(error);
        if (message) {
          push({ type: "error", error: message });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
