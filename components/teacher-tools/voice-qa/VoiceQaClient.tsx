"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, PhoneOff, RefreshCcw, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/components/platform/auth/AuthProvider";
import { generateId } from "@/utils/ai-education/helpers";
import type {
  VoiceQaServerEvent,
  VoiceQaSessionResponse,
} from "@/lib/teacher-tools/voice-qa/types";

type MessageStatus = "pending" | "streaming" | "final" | "interrupted";
type CallPhase = "idle" | "connecting" | "listening" | "processing" | "speaking" | "error";

type VoiceQaMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
};

const SPEECH_THRESHOLD = 0.04;
const SPEECH_SILENCE_MS = 850;
const MIN_RECORDING_MS = 450;
const TARGET_SAMPLE_RATE = 16000;

function readJsonIfPossible(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return Promise.resolve(null);
  }
  return response.json().catch(() => null);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return window.btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function mergeFloatChunks(chunks: Float32Array[]) {
  const totalLength = chunks.reduce((sum, item) => sum + item.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function downsampleBuffer(input: Float32Array, sourceSampleRate: number, targetSampleRate: number) {
  if (sourceSampleRate === targetSampleRate) {
    return input;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const length = Math.round(input.length / ratio);
  const output = new Float32Array(length);

  let outputIndex = 0;
  let inputIndex = 0;
  while (outputIndex < output.length) {
    const nextInputIndex = Math.round((outputIndex + 1) * ratio);
    let sum = 0;
    let count = 0;

    for (let index = inputIndex; index < nextInputIndex && index < input.length; index += 1) {
      sum += input[index];
      count += 1;
    }

    output[outputIndex] = count > 0 ? sum / count : 0;
    outputIndex += 1;
    inputIndex = nextInputIndex;
  }

  return output;
}

function pcm16Base64FromFloat32(input: Float32Array) {
  const bytes = new Uint8Array(input.length * 2);
  const view = new DataView(bytes.buffer);

  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]));
    const intValue = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(index * 2, intValue, true);
  }

  return bytesToBase64(bytes);
}

function float32FromPcm16(bytes: Uint8Array) {
  const samples = new Float32Array(bytes.length / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = view.getInt16(index * 2, true) / 0x8000;
  }

  return samples;
}

function createAbortError() {
  return new DOMException("Aborted", "AbortError");
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

export default function VoiceQaClient() {
  const { user } = useAuth();
  const [session, setSession] = useState<VoiceQaSessionResponse | null>(null);
  const [messages, setMessages] = useState<VoiceQaMessage[]>([]);
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const processorSinkRef = useRef<GainNode | null>(null);
  const monitorFrameRef = useRef<number | null>(null);
  const monitorBufferRef = useRef<Uint8Array | null>(null);
  const captureBuffersRef = useRef<Float32Array[]>([]);
  const isCapturingRef = useRef(false);
  const speechActiveRef = useRef(false);
  const speechStartedAtRef = useRef(0);
  const lastVoiceAtRef = useRef(0);
  const activeTurnAbortRef = useRef<AbortController | null>(null);
  const startupAbortRef = useRef<AbortController | null>(null);
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const sessionRef = useRef<VoiceQaSessionResponse | null>(null);
  const messagesRef = useRef<VoiceQaMessage[]>([]);
  const phaseRef = useRef<CallPhase>("idle");
  const dialogIdRef = useRef("");
  const playbackCursorRef = useRef(0);
  const playbackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const assistantAudioEndedRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      cancelPendingStartup();
      interruptActiveTurn();
      teardownAudioEnvironment();
    };
  }, []);

  function cancelPendingStartup() {
    const controller = startupAbortRef.current;
    if (controller) {
      controller.abort();
      startupAbortRef.current = null;
    }
  }

  async function ensureSession(signal?: AbortSignal) {
    if (sessionRef.current) {
      return sessionRef.current;
    }

    setPhase("connecting");
    setError(null);

    const response = await fetch("/teacher-tools/api/voice-qa/session", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      signal,
    });
    const data = await readJsonIfPossible(response);
    throwIfAborted(signal);

    if (!response.ok || !data) {
      throw new Error(data?.error || "会话初始化失败，请稍后再试。");
    }

    const nextSession = data as VoiceQaSessionResponse;
    const greetingMessages: VoiceQaMessage[] = [
      {
        id: generateId(),
        role: "assistant",
        content: nextSession.greeting,
        status: "final",
      },
    ];

    sessionRef.current = nextSession;
    messagesRef.current = greetingMessages;
    setSession(nextSession);
    setMessages(greetingMessages);
    return nextSession;
  }

  async function prepareAudioEnvironment(signal?: AbortSignal) {
    if (mediaStreamRef.current && analyserRef.current && audioContextRef.current && processorRef.current) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    throwIfAborted(signal);

    const AudioContextClass =
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("当前设备不支持语音通话。");
    }

    const audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    if (signal?.aborted) {
      stream.getTracks().forEach((track) => track.stop());
      audioContext.close().catch(() => undefined);
      throw createAbortError();
    }

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    processor.onaudioprocess = (event) => {
      if (!isCapturingRef.current) {
        return;
      }

      const channelData = event.inputBuffer.getChannelData(0);
      captureBuffersRef.current.push(new Float32Array(channelData));
    };

    source.connect(analyser);
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);
    if (signal?.aborted) {
      processor.disconnect();
      silentGain.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      audioContext.close().catch(() => undefined);
      throw createAbortError();
    }

    mediaStreamRef.current = stream;
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    processorRef.current = processor;
    processorSinkRef.current = silentGain;
    monitorBufferRef.current = new Uint8Array(analyser.fftSize);
  }

  function ensurePlaybackCursor() {
    const audioContext = audioContextRef.current;
    if (!audioContext) {
      return 0;
    }

    if (!playbackCursorRef.current || playbackCursorRef.current < audioContext.currentTime) {
      playbackCursorRef.current = audioContext.currentTime;
    }

    return playbackCursorRef.current;
  }

  function stopPlayback() {
    const sources = Array.from(playbackSourcesRef.current);
    playbackSourcesRef.current.clear();
    assistantAudioEndedRef.current = false;

    for (const source of sources) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // 忽略已经结束的节点
      }
    }

    const audioContext = audioContextRef.current;
    playbackCursorRef.current = audioContext ? audioContext.currentTime : 0;
  }

  function markAssistantInterrupted() {
    const targetId = activeAssistantMessageIdRef.current;
    if (!targetId) {
      return;
    }

    setMessages((current) =>
      current.map((item) => {
        if (item.id !== targetId || item.status === "final") {
          return item;
        }
        return {
          ...item,
          status: "interrupted",
        };
      })
    );
  }

  function interruptActiveTurn() {
    const controller = activeTurnAbortRef.current;
    if (controller) {
      controller.abort();
      activeTurnAbortRef.current = null;
    }

    stopPlayback();
    markAssistantInterrupted();
  }

  function teardownAudioEnvironment() {
    if (monitorFrameRef.current) {
      cancelAnimationFrame(monitorFrameRef.current);
      monitorFrameRef.current = null;
    }

    stopPlayback();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (processorSinkRef.current) {
      processorSinkRef.current.disconnect();
      processorSinkRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    monitorBufferRef.current = null;
    captureBuffersRef.current = [];
    isCapturingRef.current = false;
    speechActiveRef.current = false;
    speechStartedAtRef.current = 0;
    lastVoiceAtRef.current = 0;
  }

  function stopCall() {
    cancelPendingStartup();
    interruptActiveTurn();
    teardownAudioEnvironment();
    dialogIdRef.current = "";
    sessionRef.current = null;
    messagesRef.current = [];
    setPhase("idle");
    setError(null);
    setSession(null);
    setMessages([]);
  }

  function queueAssistantAudio(audioBase64: string, sampleRate: number) {
    if (isMuted) {
      return;
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) {
      return;
    }

    const bytes = base64ToBytes(audioBase64);
    const samples = float32FromPcm16(bytes);
    const buffer = audioContext.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const startAt = ensurePlaybackCursor();
    playbackSourcesRef.current.add(source);
    source.onended = () => {
      playbackSourcesRef.current.delete(source);
      if (playbackSourcesRef.current.size === 0 && assistantAudioEndedRef.current) {
        setPhase("listening");
      }
    };

    source.start(startAt);
    playbackCursorRef.current = startAt + buffer.duration;
    setPhase("speaking");
  }

  async function processCapturedTurn(audioBase64: string) {
    const currentSession = sessionRef.current;
    if (!currentSession) {
      return;
    }

    const userMessageId = generateId();
    const assistantMessageId = generateId();
    const turnId = generateId();
    const controller = new AbortController();
    activeTurnAbortRef.current = controller;
    activeAssistantMessageIdRef.current = assistantMessageId;
    assistantAudioEndedRef.current = false;
    setPhase("processing");
    setError(null);

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        content: "正在识别你刚才的话...",
        status: "pending",
      },
    ]);

    try {
      const response = await fetch(currentSession.realtimeUrl, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          turnId,
          dialogId: dialogIdRef.current || undefined,
          audio: audioBase64,
          sampleRate: currentSession.inputSampleRate,
          format: currentSession.inputFormat,
          channelCount: 1,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await readJsonIfPossible(response);
        throw new Error(data?.error || "老师暂时没有收到你的问题。");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("老师的回复流没有成功建立。");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      let assistantCreated = false;

      const ensureAssistantMessage = () => {
        if (assistantCreated) {
          return;
        }

        assistantCreated = true;
        setMessages((current) => [
          ...current,
          {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            status: "streaming",
          },
        ]);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const separatorIndex = buffer.indexOf("\n\n");
          if (separatorIndex === -1) {
            break;
          }

          const block = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);

          const payload = block
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");

          if (!payload) {
            continue;
          }

          let event: VoiceQaServerEvent | null = null;
          try {
            event = JSON.parse(payload) as VoiceQaServerEvent;
          } catch {
            continue;
          }

          if (!event) {
            continue;
          }

          if (event.type === "session_started") {
            dialogIdRef.current = event.dialogId;
          }

          if (event.type === "user_transcript_delta") {
            setMessages((current) =>
              current.map((item) =>
                item.id === userMessageId
                  ? {
                      ...item,
                      content: event.content || "正在识别...",
                      status: "streaming",
                    }
                  : item
              )
            );
          }

          if (event.type === "user_transcript_final") {
            setMessages((current) =>
              current.map((item) =>
                item.id === userMessageId
                  ? {
                      ...item,
                      content: event.content || "我刚才没有听清楚。",
                      status: "final",
                    }
                  : item
              )
            );
          }

          if (event.type === "assistant_text_delta") {
            ensureAssistantMessage();
            assistantContent += event.content;
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: assistantContent,
                      status: "streaming",
                    }
                  : item
              )
            );
          }

          if (event.type === "assistant_text_final") {
            ensureAssistantMessage();
            assistantContent = event.content;
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: event.content,
                      status: "final",
                    }
                  : item
              )
            );
          }

          if (event.type === "assistant_audio_chunk") {
            ensureAssistantMessage();
            queueAssistantAudio(event.audio, event.sampleRate);
          }

          if (event.type === "assistant_audio_end") {
            assistantAudioEndedRef.current = true;
            if (playbackSourcesRef.current.size === 0) {
              setPhase("listening");
            }
          }

          if (event.type === "session_finished") {
            dialogIdRef.current = event.dialogId;
            if (playbackSourcesRef.current.size === 0) {
              setPhase("listening");
            }
          }

          if (event.type === "error") {
            throw new Error(event.error || "老师暂时有点忙，请稍后再试。");
          }
        }
      }
    } catch (caughtError) {
      const isCurrentTurn = activeTurnAbortRef.current === controller;
      const message =
        caughtError instanceof Error && caughtError.name === "AbortError"
          ? null
          : caughtError instanceof Error
            ? caughtError.message
            : "老师暂时有点忙，请稍后再试。";

      if (message) {
        if (isCurrentTurn) {
          setError(message);
          setPhase("error");
        }
      } else if (isCurrentTurn) {
        setPhase("listening");
      }
    } finally {
      if (activeTurnAbortRef.current === controller) {
        activeTurnAbortRef.current = null;
      }
    }
  }

  function stopSpeechCapture() {
    if (!isCapturingRef.current) {
      return;
    }

    isCapturingRef.current = false;
    const chunks = captureBuffersRef.current;
    captureBuffersRef.current = [];

    if (!chunks.length) {
      return;
    }

    if (Date.now() - speechStartedAtRef.current < MIN_RECORDING_MS) {
      return;
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) {
      return;
    }

    const merged = mergeFloatChunks(chunks);
    const downsampled = downsampleBuffer(merged, audioContext.sampleRate, TARGET_SAMPLE_RATE);
    const audioBase64 = pcm16Base64FromFloat32(downsampled);

    processCapturedTurn(audioBase64).catch((caughtError) => {
      console.error("[voice-qa/processCapturedTurn] failed:", caughtError);
      setError("这次语音没有处理成功，你可以再说一遍。");
      setPhase("error");
    });
  }

  function startSpeechCapture() {
    if (!sessionRef.current || isCapturingRef.current) {
      return;
    }

    interruptActiveTurn();
    captureBuffersRef.current = [];
    isCapturingRef.current = true;
    speechStartedAtRef.current = Date.now();
    setPhase("listening");
  }

  function startMonitoring() {
    const analyser = analyserRef.current;
    const buffer = monitorBufferRef.current;
    if (!analyser || !buffer) {
      return;
    }

    const loop = () => {
      if (!sessionRef.current) {
        return;
      }

      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let index = 0; index < buffer.length; index += 1) {
        const normalized = (buffer[index] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / buffer.length);
      const now = Date.now();

      if (rms > SPEECH_THRESHOLD) {
        lastVoiceAtRef.current = now;
        if (!speechActiveRef.current) {
          speechActiveRef.current = true;
          startSpeechCapture();
        }
      } else if (
        speechActiveRef.current &&
        lastVoiceAtRef.current > 0 &&
        now - lastVoiceAtRef.current > SPEECH_SILENCE_MS
      ) {
        speechActiveRef.current = false;
        stopSpeechCapture();
      }

      monitorFrameRef.current = window.requestAnimationFrame(loop);
    };

    monitorFrameRef.current = window.requestAnimationFrame(loop);
  }

  async function startCall() {
    cancelPendingStartup();
    const controller = new AbortController();
    startupAbortRef.current = controller;

    try {
      const nextSession = await ensureSession(controller.signal);
      if (!nextSession) {
        return;
      }

      setGuideOpen(false);
      await prepareAudioEnvironment(controller.signal);
      throwIfAborted(controller.signal);
      setPhase("listening");
      startMonitoring();
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === "AbortError") {
        teardownAudioEnvironment();
        return;
      }

      console.error("[voice-qa/startCall] failed:", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : "麦克风或会话启动失败，请稍后再试。"
      );
      setPhase("error");
    } finally {
      if (startupAbortRef.current === controller) {
        startupAbortRef.current = null;
      }
    }
  }

  async function reconnectCall() {
    stopCall();
    await startCall();
  }

  const accountLabel =
    user?.accountType === "guest" ? "游客模式" : user?.accountType === "formal" ? "正式账号" : "未登录";
  const statusLabel =
    phase === "idle"
      ? "未开始"
      : phase === "connecting"
        ? "正在连接"
        : phase === "listening"
          ? "正在聆听"
          : phase === "processing"
            ? "老师思考中"
        : phase === "speaking"
          ? "老师正在回答"
          : "出现异常";
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user") || null;
  const latestAssistantMessage =
    [...messages].reverse().find((message) => message.role === "assistant") || null;
  const heroText =
    phase === "idle"
      ? "你可以开始说话"
      : phase === "connecting"
        ? "正在连接李雪老师"
        : phase === "listening"
          ? "我在听，你直接说就行"
          : phase === "processing"
            ? "我在想一想，马上回答你"
            : phase === "speaking"
              ? "李雪老师正在回答"
              : "现在出了点小问题";
  const phaseClassName =
    phase === "speaking"
      ? "voice-qa-hero-avatar-shell-speaking"
      : phase === "processing"
        ? "voice-qa-hero-avatar-shell-processing"
        : phase === "listening"
          ? "voice-qa-hero-avatar-shell-listening"
          : "";

  return (
    <main className="voice-qa-shell">
      <header className="voice-qa-header">
        <div className="voice-qa-header-left">
          <Link href="/teacher-tools" className="voice-qa-back">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="voice-qa-eyebrow">教师工具</p>
            <h1 className="voice-qa-title">你问我答</h1>
          </div>
        </div>
        <div className="voice-qa-header-right">
          <span className="voice-qa-pill">{accountLabel}</span>
          <span className="voice-qa-pill voice-qa-pill-strong">{statusLabel}</span>
        </div>
      </header>

      <section className="voice-qa-stage">
        <div className="voice-qa-hero">
          <div className="voice-qa-hero-top">
            <span className="voice-qa-hero-pill">{accountLabel}</span>
            <span className="voice-qa-hero-pill">{statusLabel}</span>
          </div>

          <div className={`voice-qa-hero-avatar-shell ${phaseClassName}`}>
            <img
              src="/teacher-tools/voice-qa/avatar.gif"
              alt="李雪老师头像"
              className="voice-qa-hero-avatar"
            />
          </div>

          <div className="voice-qa-hero-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <p className="voice-qa-hero-text">{heroText}</p>

          <div className="voice-qa-live-card">
            <p className="voice-qa-live-line">
              <span className="voice-qa-live-label">你刚才说</span>
              <span className="voice-qa-live-content">
                {latestUserMessage?.content || "点开始通话后，直接说出你的问题。"}
              </span>
            </p>
            <p className="voice-qa-live-line">
              <span className="voice-qa-live-label">老师回应</span>
              <span className="voice-qa-live-content">
                {latestAssistantMessage?.content || "我会在这里实时显示老师的回答。"}
              </span>
            </p>
          </div>

          <p className="voice-qa-hero-note">本页刷新后自动清空，不保存聊天内容</p>
        </div>

        <div className="voice-qa-panel voice-qa-transcript">
          <div className="voice-qa-transcript-head">
            <div>
              <p className="voice-qa-panel-label">对话内容</p>
              <p className="voice-qa-panel-value">当前账号：{user?.displayName || accountLabel}</p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="voice-qa-empty">
              <p className="voice-qa-empty-title">准备好了就直接开口</p>
              <p className="voice-qa-empty-text">
                点开始后，我会持续听你说话。你停下来一小会儿，我就会自动回答。
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`voice-qa-message-row ${
                message.role === "user" ? "voice-qa-message-row-user" : "voice-qa-message-row-assistant"
              }`}
            >
              <article
                className={`voice-qa-bubble ${
                  message.role === "user" ? "voice-qa-bubble-user" : "voice-qa-bubble-assistant"
                }`}
              >
                <div className="voice-qa-bubble-head">
                  <span>{message.role === "user" ? "你" : "李雪老师"}</span>
                  {message.status === "interrupted" ? (
                    <span className="voice-qa-bubble-tag">已打断</span>
                  ) : null}
                </div>
                <p className="voice-qa-bubble-text">{message.content || "..."}</p>
              </article>
            </div>
          ))}

          {error ? <div className="voice-qa-error">{error}</div> : null}
        </div>
      </section>

      <footer className="voice-qa-controls">
        <div className="voice-qa-control-item">
          <button
            type="button"
            className="voice-qa-control-btn voice-qa-control-btn-primary"
            onClick={() => {
              if (phase === "idle") {
                startCall();
                return;
              }
              stopCall();
            }}
          >
            {phase === "idle" ? <Mic size={28} /> : <PhoneOff size={28} />}
          </button>
          <span className="voice-qa-control-label">{phase === "idle" ? "开始通话" : "挂断"}</span>
        </div>

        <div className="voice-qa-control-item">
          <button
            type="button"
            className="voice-qa-control-btn"
            onClick={() => {
              setIsMuted((current) => {
                const next = !current;
                if (next) {
                  stopPlayback();
                }
                return next;
              });
            }}
          >
            {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
          </button>
          <span className="voice-qa-control-label">{isMuted ? "已静音" : "播放开"}</span>
        </div>

        <div className="voice-qa-control-item">
          <button type="button" className="voice-qa-control-btn" onClick={reconnectCall}>
            <RefreshCcw size={28} />
          </button>
          <span className="voice-qa-control-label">重连</span>
        </div>

        <div className="voice-qa-control-item">
          <button
            type="button"
            className="voice-qa-control-btn voice-qa-control-btn-danger"
            onClick={() => {
              if (!sessionRef.current) {
                return;
              }
              interruptActiveTurn();
              setPhase("listening");
            }}
          >
            <MicOff size={28} />
          </button>
          <span className="voice-qa-control-label">打断回答</span>
        </div>
      </footer>

      {guideOpen ? (
        <div className="voice-qa-guide-mask">
          <div className="voice-qa-guide-card">
            <p className="voice-qa-guide-title">使用前先看一下</p>
            <ul className="voice-qa-guide-list">
              <li>点“开始通话”后，需要先同意麦克风权限。</li>
              <li>你只要正常说话，停顿一小会儿后老师就会自动回答。</li>
              <li>如果老师还在说话，你直接开口或者点“打断回答”都能停下。</li>
              <li>游客和正式账号都能用，但这里不会保存聊天记录。</li>
            </ul>
            <div className="voice-qa-guide-actions">
              <button type="button" className="voice-qa-guide-btn" onClick={() => setGuideOpen(false)}>
                先看看页面
              </button>
              <button
                type="button"
                className="voice-qa-guide-btn voice-qa-guide-btn-primary"
                onClick={startCall}
              >
                我知道了，开始
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
