import { randomUUID } from "crypto";
import { incrementUsageCount } from "@/lib/ai-education/server/usageStats";
import { requireAnyUser, toPublicUser } from "@/lib/platform/auth";
import { generateId } from "@/utils/ai-education/helpers";
import {
  VOICE_QA_BOT_NAME,
  VOICE_QA_AUDIT_RESPONSE,
  VOICE_QA_GREETING,
  buildVoiceQaSpeakingStyle,
  buildVoiceQaSystemRole,
} from "./prompt";
import { buildAudioFrame, buildJsonFrame, parseVoiceQaFrame } from "./protocol";
import {
  VOICE_QA_INPUT_FORMAT,
  VOICE_QA_INPUT_SAMPLE_RATE,
  VOICE_QA_TOOL_TITLE,
  VOICE_QA_TTS_FORMAT,
  VOICE_QA_TTS_SAMPLE_RATE,
  type VoiceQaServerEvent,
  type VoiceQaSessionResponse,
} from "./types";

const VOICE_QA_WS_URL = "wss://openspeech.bytedance.com/api/v3/realtime/dialogue";
const VOICE_QA_RESOURCE_ID = "volc.speech.dialog";
const VOICE_QA_APP_KEY = "PlgvMymc7f3tQnJ6";
const VOICE_QA_MODEL_VERSION = "1.2.1.1";
const VOICE_QA_SPEAKER = "zh_female_vv_jupiter_bigtts";

type VoiceQaReadablePayload = {
  content?: string;
  dialog_id?: string;
  error?: string;
  message?: string;
  results?: Array<{
    text?: string;
    is_interim?: boolean;
  }>;
  status_code?: string | number;
};

type NodeWebSocketConstructor = new (
  url: string,
  options?: {
    headers?: Record<string, string>;
  }
) => WebSocket;

type VoiceQaTurnStreamParams = {
  sessionId: string;
  turnId: string;
  dialogId?: string;
  audioBuffer: Buffer;
  onEvent: (event: VoiceQaServerEvent) => void;
  signal?: AbortSignal;
};

type VoiceQaReader = {
  next: (signal?: AbortSignal) => Promise<Buffer>;
  waitForOpen: (signal?: AbortSignal) => Promise<void>;
  close: () => void;
};

function buildFriendlyVoiceError(defaultMessage: string) {
  return defaultMessage || "语音服务暂时有点忙，请稍后再试。";
}

function getVoiceQaRuntimeConfig() {
  const appId = String(process.env.VOLCENGINE_VOICE_APP_ID || "").trim();
  const accessToken = String(process.env.VOLCENGINE_VOICE_ACCESS_TOKEN || "").trim();

  if (!appId || !accessToken) {
    throw new Error("火山语音配置缺失");
  }

  return {
    appId,
    accessToken,
  };
}

function buildStartSessionPayload(dialogId?: string) {
  return {
    asr: {
      extra: {
        end_smooth_window_ms: 1200,
        enable_custom_vad: true,
      },
    },
    tts: {
      speaker: VOICE_QA_SPEAKER,
      audio_config: {
        channel: 1,
        format: VOICE_QA_TTS_FORMAT,
        sample_rate: VOICE_QA_TTS_SAMPLE_RATE,
      },
    },
    dialog: {
      dialog_id: dialogId || "",
      bot_name: VOICE_QA_BOT_NAME,
      system_role: buildVoiceQaSystemRole(),
      speaking_style: buildVoiceQaSpeakingStyle(),
      extra: {
        strict_audit: true,
        audit_response: VOICE_QA_AUDIT_RESPONSE,
        recv_timeout: 20,
        input_mod: "audio_file",
        enable_loudness_norm: false,
        enable_user_query_exit: false,
        model: VOICE_QA_MODEL_VERSION,
      },
    },
  };
}

async function delay(ms: number, signal?: AbortSignal) {
  if (!ms) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function normalizeWsData(data: MessageEvent["data"]) {
  if (typeof data === "string") {
    return Promise.resolve(Buffer.from(data, "utf8"));
  }

  if (data instanceof ArrayBuffer) {
    return Promise.resolve(Buffer.from(data));
  }

  if (ArrayBuffer.isView(data)) {
    return Promise.resolve(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
  }

  if (data instanceof Blob) {
    return data.arrayBuffer().then((value) => Buffer.from(value));
  }

  return Promise.resolve(Buffer.alloc(0));
}

function createWebSocketReader(socket: WebSocket): VoiceQaReader {
  const queue: Buffer[] = [];
  const waiting: Array<{
    resolve: (value: Buffer) => void;
    reject: (reason: unknown) => void;
  }> = [];
  let open = socket.readyState === WebSocket.OPEN;
  let terminalError: Error | null = null;
  let openResolve: (() => void) | null = open ? () => undefined : null;
  let openReject: ((reason: unknown) => void) | null = null;

  const cleanup = () => {
    socket.removeEventListener("open", handleOpen);
    socket.removeEventListener("message", handleMessage);
    socket.removeEventListener("error", handleError);
    socket.removeEventListener("close", handleClose);
  };

  const failAll = (error: Error) => {
    terminalError = error;
    while (waiting.length > 0) {
      waiting.shift()?.reject(error);
    }
    if (openReject) {
      openReject(error);
    }
  };

  const handleOpen = () => {
    open = true;
    openResolve?.();
  };

  const handleMessage = async (event: MessageEvent) => {
    try {
      const next = await normalizeWsData(event.data);
      if (waiting.length > 0) {
        waiting.shift()?.resolve(next);
        return;
      }
      queue.push(next);
    } catch (error) {
      failAll(error instanceof Error ? error : new Error("读取语音服务消息失败"));
    }
  };

  const handleError = () => {
    failAll(new Error("火山语音连接失败"));
  };

  const handleClose = () => {
    if (!terminalError) {
      failAll(new Error("火山语音连接已关闭"));
    }
    cleanup();
  };

  socket.addEventListener("open", handleOpen);
  socket.addEventListener("message", handleMessage);
  socket.addEventListener("error", handleError);
  socket.addEventListener("close", handleClose);

  return {
    waitForOpen(signal) {
      if (open) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        openResolve = resolve;
        openReject = reject;
        signal?.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true }
        );
      });
    },
    next(signal) {
      if (queue.length > 0) {
        return Promise.resolve(queue.shift() as Buffer);
      }

      if (terminalError) {
        return Promise.reject(terminalError);
      }

      return new Promise<Buffer>((resolve, reject) => {
        waiting.push({ resolve, reject });
        signal?.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true }
        );
      });
    },
    close() {
      cleanup();
    },
  };
}

function readableTextPayload(value: unknown) {
  return (value && typeof value === "object" ? (value as VoiceQaReadablePayload) : {}) as VoiceQaReadablePayload;
}

async function waitForEvent(
  reader: VoiceQaReader,
  expectedEvent: number,
  signal?: AbortSignal
) {
  while (true) {
    const frame = parseVoiceQaFrame(await reader.next(signal));
    if (frame.event === expectedEvent) {
      return frame;
    }

    if (frame.event === 51 || frame.event === 153 || frame.event === 599) {
      const payload = readableTextPayload(frame.payloadJson);
      throw new Error(String(payload.error || payload.message || "语音会话启动失败"));
    }

    if (frame.messageType === 0b1111) {
      const payload = readableTextPayload(frame.payloadJson);
      throw new Error(String(payload.error || payload.message || "语音服务返回错误"));
    }
  }
}

async function sendAudioAsRealtimeFile(
  socket: WebSocket,
  sessionId: string,
  audioBuffer: Buffer,
  signal?: AbortSignal
) {
  const chunkSize = 640;

  for (let offset = 0; offset < audioBuffer.length; offset += chunkSize) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const chunk = audioBuffer.subarray(offset, Math.min(offset + chunkSize, audioBuffer.length));
    socket.send(buildAudioFrame(200, chunk, sessionId));
    if (offset + chunkSize < audioBuffer.length) {
      await delay(20, signal);
    }
  }
}

function ensurePcmS16le(audioBuffer: Buffer, sampleRate: number, format: string, channelCount: number) {
  if (format !== VOICE_QA_INPUT_FORMAT || sampleRate !== VOICE_QA_INPUT_SAMPLE_RATE || channelCount !== 1) {
    throw new Error("音频格式不符合要求");
  }

  return audioBuffer;
}

async function cleanupSocket(socket: WebSocket) {
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close();
  }
}

export async function requireVoiceQaUser() {
  return requireAnyUser();
}

export function buildVoiceQaSessionResponse(user: any): VoiceQaSessionResponse {
  const publicUser = toPublicUser(user);
  return {
    sessionId: generateId(),
    realtimeUrl: "/teacher-tools/api/voice-qa/realtime",
    userType: publicUser.accountType === "guest" ? "guest" : "formal",
    displayName: publicUser.displayName || "同学",
    greeting: VOICE_QA_GREETING,
    toolTitle: VOICE_QA_TOOL_TITLE,
    speaker: VOICE_QA_SPEAKER,
    outputSampleRate: VOICE_QA_TTS_SAMPLE_RATE,
    outputFormat: VOICE_QA_TTS_FORMAT,
    inputSampleRate: VOICE_QA_INPUT_SAMPLE_RATE,
    inputFormat: VOICE_QA_INPUT_FORMAT,
  };
}

export async function recordVoiceQaUsage(user: any) {
  if (!user?._id) {
    return;
  }

  await incrementUsageCount(user._id, "teacher-tools-voice-qa");
}

export async function streamVoiceQaTurn(params: VoiceQaTurnStreamParams) {
  const { appId, accessToken } = getVoiceQaRuntimeConfig();
  const connectId = randomUUID();
  const NodeWebSocket = WebSocket as unknown as NodeWebSocketConstructor;
  const socket = new NodeWebSocket(VOICE_QA_WS_URL, {
    headers: {
      "X-Api-App-ID": appId,
      "X-Api-Access-Key": accessToken,
      "X-Api-Resource-Id": VOICE_QA_RESOURCE_ID,
      "X-Api-App-Key": VOICE_QA_APP_KEY,
      "X-Api-Connect-Id": connectId,
    },
  });

  const reader = createWebSocketReader(socket);

  try {
    await reader.waitForOpen(params.signal);

    socket.send(buildJsonFrame(1, {}));
    await waitForEvent(reader, 50, params.signal);

    socket.send(buildJsonFrame(100, buildStartSessionPayload(params.dialogId), params.sessionId));
    const sessionStarted = await waitForEvent(reader, 150, params.signal);
    const sessionPayload = readableTextPayload(sessionStarted.payloadJson);
    const nextDialogId = String(sessionPayload.dialog_id || params.dialogId || "");

    params.onEvent({
      type: "session_started",
      sessionId: params.sessionId,
      turnId: params.turnId,
      dialogId: nextDialogId,
    });
    params.onEvent({
      type: "listening",
      sessionId: params.sessionId,
    });

    const uploadPromise = sendAudioAsRealtimeFile(
      socket,
      params.sessionId,
      params.audioBuffer,
      params.signal
    );

    let assistantText = "";
    let latestUserText = "";
    let userFinalized = false;
    let ttsEnded = false;

    while (!ttsEnded) {
      const frame = parseVoiceQaFrame(await reader.next(params.signal));
      const payload = readableTextPayload(frame.payloadJson);

      if (frame.messageType === 0b1111) {
        throw new Error(String(payload.error || payload.message || "语音服务返回错误"));
      }

      switch (frame.event) {
        case 450:
          params.onEvent({ type: "listening", sessionId: params.sessionId });
          break;
        case 451: {
          const latest = String(payload.results?.[0]?.text || "").trim();
          if (!latest) {
            break;
          }

          if (payload.results?.[0]?.is_interim) {
            latestUserText = latest;
            params.onEvent({ type: "user_transcript_delta", content: latest });
            break;
          }

          latestUserText = latest;
          userFinalized = true;
          params.onEvent({ type: "user_transcript_final", content: latest });
          break;
        }
        case 459:
          if (!userFinalized && latestUserText) {
            userFinalized = true;
            params.onEvent({ type: "user_transcript_final", content: latestUserText });
          }
          break;
        case 550: {
          const content = String(payload.content || "");
          if (!content) {
            break;
          }

          assistantText += content;
          params.onEvent({ type: "assistant_text_delta", content });
          break;
        }
        case 559:
          params.onEvent({
            type: "assistant_text_final",
            content: assistantText.trim() || "我在呢，你可以换一种说法再问我一次。",
          });
          break;
        case 352:
          params.onEvent({
            type: "assistant_audio_chunk",
            audio: frame.payload.toString("base64"),
            audioFormat: VOICE_QA_TTS_FORMAT,
            sampleRate: VOICE_QA_TTS_SAMPLE_RATE,
          });
          break;
        case 359:
          params.onEvent({ type: "assistant_audio_end" });
          ttsEnded = true;
          break;
        case 51:
        case 153:
        case 599:
          throw new Error(String(payload.error || payload.message || "语音服务处理失败"));
        default:
          break;
      }
    }

    await uploadPromise;
    socket.send(buildJsonFrame(102, {}, params.sessionId));
    await waitForEvent(reader, 152, params.signal);
    socket.send(buildJsonFrame(2, {}));
    await waitForEvent(reader, 52, params.signal);

    params.onEvent({
      type: "session_finished",
      sessionId: params.sessionId,
      turnId: params.turnId,
      dialogId: nextDialogId,
    });
  } finally {
    reader.close();
    await cleanupSocket(socket);
  }
}

export function decodeVoiceQaAudio(params: {
  audioBase64: string;
  sampleRate: number;
  format: string;
  channelCount: number;
}) {
  const audioBuffer = Buffer.from(params.audioBase64, "base64");
  return ensurePcmS16le(audioBuffer, params.sampleRate, params.format, params.channelCount);
}

export function toFriendlyVoiceQaError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "火山语音配置缺失") {
      return "火山语音配置缺失，请先在 Vercel 里补齐参数。";
    }

    if (error.name === "AbortError") {
      return "";
    }

    return buildFriendlyVoiceError(error.message);
  }

  return buildFriendlyVoiceError("语音服务暂时有点忙，请稍后再试。");
}
