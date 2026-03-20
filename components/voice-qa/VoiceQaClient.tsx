"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Volume2, VolumeX } from "lucide-react";
import Modal from "@/components/24-point/ui/Modal";
import { buildVoiceQaSystemRole } from "@/lib/voice-qa/prompt";
import { generateId } from "@/utils/ai-education/helpers";
import type {
  VoiceQaServerEvent,
  VoiceQaSessionResponse,
} from "@/lib/voice-qa/types";

type MessageStatus = "pending" | "streaming" | "final" | "interrupted";
type CallPhase = "idle" | "connecting" | "listening" | "processing" | "speaking" | "error";
type DemoPresetId = "parallelogram";

type VoiceQaMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  demoPreset?: DemoPresetId;
};

const MIN_RECORDING_MS = 450;
const TARGET_SAMPLE_RATE = 16000;
const STREAMING_RENDER_INTERVAL_MS = 96;
const FIRST_TURN_TEXT_DELAY_MS = 900;
const PAUSE_IMAGE_SRC = "/voice-qa/pause.png";
const PLAY_GIF_SRC = "/voice-qa/play.gif";
const DEFAULT_SYSTEM_ROLE = buildVoiceQaSystemRole();
const SYSTEM_ROLE_STORAGE_KEY = "voice-qa-system-role";

const PARALLELOGRAM_FORCED_TEXT = "不对的，长方形的面积可以直接用两个邻边相乘计算，也就是长乘以宽。但如果是一般平行四边形的面积，正确公式是：底 × 高，而不是邻边相乘。我们一起分析原因：长方形的邻边垂直，此时宽就是高，所以邻边相乘 就是底×高。但一般平行四边形的邻边不垂直，此时邻边相乘算出的是底边 × 斜边，这个数值会比实际面积大。";

const DEMO_PRESETS: Array<{ id: DemoPresetId; name: string }> = [
  { id: "parallelogram", name: "平行四边形" }
];

function ParallelogramDemo() {
  return (
    <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
      <svg width="100%" height="auto" viewBox="0 0 300 220" style={{ maxWidth: "300px" }}>
          <line x1="100" y1="40" x2="260" y2="40" stroke="black" strokeWidth="2" />
          <line x1="260" y1="40" x2="200" y2="160" stroke="black" strokeWidth="2" />
          <line x1="40" y1="160" x2="200" y2="160" stroke="red" strokeWidth="6" strokeLinecap="round" />
          <line x1="40" y1="160" x2="100" y2="40" stroke="red" strokeWidth="6" strokeLinecap="round" />
          <text x="120" y="195" fontSize="24" fontWeight="bold" fill="black" textAnchor="middle">邻边</text>
          <text x="45" y="100" fontSize="24" fontWeight="bold" fill="black" textAnchor="middle" transform="rotate(-63.4, 45, 100)">邻边</text>
      </svg>
    </div>
  );
}

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
  const [session, setSession] = useState<VoiceQaSessionResponse | null>(null);
  const [messages, setMessages] = useState<VoiceQaMessage[]>([]);
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [micOpen, setMicOpen] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [teacherGifReady, setTeacherGifReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [demoPreset, setDemoPreset] = useState<DemoPresetId | null>(null);
  const [systemRole, setSystemRole] = useState(DEFAULT_SYSTEM_ROLE);
  const [systemRoleDraft, setSystemRoleDraft] = useState(DEFAULT_SYSTEM_ROLE);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const processorSinkRef = useRef<GainNode | null>(null);
  const playbackGainRef = useRef<GainNode | null>(null);
  const captureBuffersRef = useRef<Float32Array[]>([]);
  const isCapturingRef = useRef(false);
  const isMutedRef = useRef(false);
  const speechStartedAtRef = useRef(0);
  const activeTurnAbortRef = useRef<AbortController | null>(null);
  const startupAbortRef = useRef<AbortController | null>(null);
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const sessionRef = useRef<VoiceQaSessionResponse | null>(null);
  const phaseRef = useRef<CallPhase>("idle");
  const micOpenRef = useRef(false);
  const dialogIdRef = useRef<string | null>(null);
  const playbackCursorRef = useRef(0);
  const playbackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const assistantAudioEndedRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const topActionsRef = useRef<HTMLDivElement | null>(null);
  const systemRoleLoadedRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const lastUserTranscriptRenderAtRef = useRef(0);
  const lastAssistantRenderAtRef = useRef(0);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    micOpenRef.current = micOpen;
  }, [micOpen]);

  useEffect(() => {
    if (systemRoleLoadedRef.current) {
      return;
    }

    systemRoleLoadedRef.current = true;

    try {
      const savedSystemRole = window.localStorage.getItem(SYSTEM_ROLE_STORAGE_KEY);
      if (savedSystemRole !== null) {
        setSystemRole(savedSystemRole);
        setSystemRoleDraft(savedSystemRole);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (playbackGainRef.current) {
      playbackGainRef.current.gain.value = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!topActionsRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const frameImage = new window.Image();
    frameImage.src = PAUSE_IMAGE_SRC;

    const teacherImage = new window.Image();
    const markReady = () => setTeacherGifReady(true);
    teacherImage.addEventListener("load", markReady, { once: true });
    teacherImage.src = PLAY_GIF_SRC;

    if (teacherImage.complete) {
      setTeacherGifReady(true);
    }

    return () => {
      teacherImage.removeEventListener("load", markReady);
    };
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollFrameRef.current) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      scrollFrameRef.current = null;
    });
    return () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [messages]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
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

  function isAssistantReplyLocked() {
    const currentPhase = phaseRef.current;
    return (
      currentPhase === "processing" ||
      currentPhase === "speaking" ||
      activeTurnAbortRef.current !== null ||
      playbackSourcesRef.current.size > 0
    );
  }

  async function ensureSession(signal?: AbortSignal) {
    if (sessionRef.current) {
      return sessionRef.current;
    }

    setPhase("connecting");
    setError(null);

    const response = await fetch("/api/voice-qa/session", {
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
    setSession(nextSession);
    setMessages(greetingMessages);
    return nextSession;
  }

  async function prepareAudioEnvironment(signal?: AbortSignal) {
    if (mediaStreamRef.current && analyserRef.current && audioContextRef.current && (workletNodeRef.current || processorRef.current)) {
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
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    const playbackGain = audioContext.createGain();
    playbackGain.gain.value = isMutedRef.current ? 0 : 1;

    source.connect(analyser);
    playbackGain.connect(audioContext.destination);

    let useWorklet = false;
    try {
      if (audioContext.audioWorklet) {
        await audioContext.audioWorklet.addModule('/voice-qa/audio-worklet-processor.js');
        const workletNode = new AudioWorkletNode(audioContext, 'voice-capture-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1,
        });

        workletNode.port.onmessage = (event) => {
          if (event.data.type === 'audio' && isCapturingRef.current) {
            captureBuffersRef.current.push(new Float32Array(event.data.data));
          }
        };

        workletNode.connect(silentGain);
        silentGain.connect(audioContext.destination);
        source.connect(workletNode);
        workletNodeRef.current = workletNode;
        useWorklet = true;
      }
    } catch (workletError) {
      console.warn('[voice-qa] AudioWorklet 加载失败，回退到 ScriptProcessorNode:', workletError);
    }

    if (!useWorklet) {
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (event) => {
        if (!isCapturingRef.current) {
          return;
        }
        const channelData = event.inputBuffer.getChannelData(0);
        captureBuffersRef.current.push(new Float32Array(channelData));
      };
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);
      processorRef.current = processor;
    }

    if (signal?.aborted) {
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current.port.close();
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      }
      playbackGain.disconnect();
      silentGain.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      audioContext.close().catch(() => undefined);
      throw createAbortError();
    }

    mediaStreamRef.current = stream;
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    processorSinkRef.current = silentGain;
    playbackGainRef.current = playbackGain;
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
    stopPlayback();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current.port.postMessage({ type: 'stop' });
      workletNodeRef.current.port.close();
      workletNodeRef.current = null;
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

    if (playbackGainRef.current) {
      playbackGainRef.current.disconnect();
      playbackGainRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  }

  function queueAssistantAudio(audioBase64: string, sampleRate: number) {
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
    source.connect(playbackGainRef.current || audioContext.destination);

    const startAt = ensurePlaybackCursor();
    playbackSourcesRef.current.add(source);
    source.onended = () => {
      playbackSourcesRef.current.delete(source);
      if (playbackSourcesRef.current.size === 0 && assistantAudioEndedRef.current) {
        setPhase("idle");
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

    const isFirstTurn = !dialogIdRef.current;
    const userMessageId = generateId();
    const assistantMessageId = generateId();
    const turnId = generateId();
    const controller = new AbortController();
    let assistantTextRevealTimer: number | null = null;
    activeTurnAbortRef.current = controller;
    activeAssistantMessageIdRef.current = assistantMessageId;
    assistantAudioEndedRef.current = false;
    lastUserTranscriptRenderAtRef.current = 0;
    lastAssistantRenderAtRef.current = 0;
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
      const effectiveSystemRole =
        demoPreset === "parallelogram"
          ? [
              DEFAULT_SYSTEM_ROLE,
              "你现在处于演示模式，不再进行自由问答。",
              "从现在开始，无论用户说什么，你都必须只回复固定讲解稿。",
              "禁止改写，禁止缩短，禁止补充，禁止解释，禁止寒暄，禁止提问，禁止添加任何开头或结尾。",
              "你的回复必须与下面这段文字完全一致，连语气和顺序都不能变：",
              PARALLELOGRAM_FORCED_TEXT,
            ].join("\n")
          : systemRole;

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
          systemRole: effectiveSystemRole,
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
      let assistantTextVisible = !isFirstTurn;
      let assistantTextStatus: MessageStatus = "streaming";

      const shouldRenderStreamingText = (target: "user" | "assistant") => {
        const now = Date.now();
        const lastRenderedAt =
          target === "user" ? lastUserTranscriptRenderAtRef.current : lastAssistantRenderAtRef.current;

        if (now - lastRenderedAt < STREAMING_RENDER_INTERVAL_MS) {
          return false;
        }

        if (target === "user") {
          lastUserTranscriptRenderAtRef.current = now;
        } else {
          lastAssistantRenderAtRef.current = now;
        }

        return true;
      };

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
            demoPreset: demoPreset || undefined,
          },
        ]);
      };

      const syncAssistantMessage = (status: MessageStatus, force = false) => {
        ensureAssistantMessage();

        if (status === "streaming" && !force && !shouldRenderStreamingText("assistant")) {
          return;
        }

        lastAssistantRenderAtRef.current = Date.now();
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: assistantContent,
                  status,
                }
              : item
          )
        );
      };

      const revealAssistantText = () => {
        if (assistantTextVisible) {
          return;
        }

        assistantTextVisible = true;

        if (assistantTextRevealTimer) {
          clearTimeout(assistantTextRevealTimer);
          assistantTextRevealTimer = null;
        }

        if (!assistantContent) {
          return;
        }

        syncAssistantMessage(assistantTextStatus, true);
      };

      const scheduleAssistantTextReveal = () => {
        if (!isFirstTurn || assistantTextVisible || assistantTextRevealTimer) {
          return;
        }

        assistantTextRevealTimer = window.setTimeout(() => {
          assistantTextRevealTimer = null;
          revealAssistantText();
        }, FIRST_TURN_TEXT_DELAY_MS);
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
            if (!shouldRenderStreamingText("user")) {
              continue;
            }

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
            lastUserTranscriptRenderAtRef.current = Date.now();
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
            assistantContent += event.content;
            assistantTextStatus = "streaming";
            scheduleAssistantTextReveal();

            if (!assistantTextVisible) {
              continue;
            }

            syncAssistantMessage("streaming");
          }

          if (event.type === "assistant_text_final") {
            assistantContent = event.content;
            assistantTextStatus = "final";
            scheduleAssistantTextReveal();

            if (!assistantTextVisible) {
              continue;
            }

            syncAssistantMessage("final", true);
          }

          if (event.type === "assistant_audio_chunk") {
            revealAssistantText();
            queueAssistantAudio(event.audio, event.sampleRate);
          }

          if (event.type === "assistant_audio_end") {
            assistantAudioEndedRef.current = true;
            if (playbackSourcesRef.current.size === 0) {
              setPhase("idle");
            }
          }

          if (event.type === "session_finished") {
            dialogIdRef.current = event.dialogId;
            if (playbackSourcesRef.current.size === 0) {
              setPhase("idle");
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
        setPhase("idle");
      }
    } finally {
      if (assistantTextRevealTimer) {
        clearTimeout(assistantTextRevealTimer);
      }

      if (activeTurnAbortRef.current === controller) {
        activeTurnAbortRef.current = null;
      }
    }
  }

  function startSpeechCapture() {
    if (!sessionRef.current || isCapturingRef.current || isAssistantReplyLocked()) {
      return;
    }
    
    // Stop any ongoing playback from the assistant if user interrupts
    interruptActiveTurn();

    captureBuffersRef.current = [];
    isCapturingRef.current = true;
    speechStartedAtRef.current = Date.now();
    setPhase("listening");

    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'start' });
    }
  }

  function stopSpeechCapture() {
    if (!isCapturingRef.current) {
      return;
    }

    isCapturingRef.current = false;
    setPhase("processing");

    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'stop' });
    }

    const chunks = captureBuffersRef.current;
    captureBuffersRef.current = [];

    if (!chunks.length) {
      setPhase("idle");
      return;
    }

    if (Date.now() - speechStartedAtRef.current < MIN_RECORDING_MS) {
      setPhase("idle");
      return;
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) {
      setPhase("idle");
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

  async function openMicrophone() {
    cancelPendingStartup();
    const controller = new AbortController();
    startupAbortRef.current = controller;

    try {
      const nextSession = await ensureSession(controller.signal);
      if (!nextSession) {
        return;
      }

      await prepareAudioEnvironment(controller.signal);
      throwIfAborted(controller.signal);
      setError(null);
      micOpenRef.current = true;
      setMicOpen(true);
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === "AbortError") {
        micOpenRef.current = false;
        setMicOpen(false);
        setPhase("idle");
        return;
      }

      console.error("[voice-qa/openMicrophone] failed:", caughtError);
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

  function openAgentSettings() {
    setIsMenuOpen(false);
    setSystemRoleDraft(systemRole);
    setIsSettingsOpen(true);
  }

  function closeAgentSettings() {
    setIsSettingsOpen(false);
    setSystemRoleDraft(systemRole);
  }

  function saveAgentSettings() {
    setSystemRole(systemRoleDraft);

    try {
      window.localStorage.setItem(SYSTEM_ROLE_STORAGE_KEY, systemRoleDraft);
    } catch {
    }

    setIsSettingsOpen(false);
  }

  function toggleMute() {
    setIsMuted((current) => !current);
  }

  function clearConversation() {
    cancelPendingStartup();
    interruptActiveTurn();
    isCapturingRef.current = false;
    captureBuffersRef.current = [];
    speechStartedAtRef.current = 0;
    dialogIdRef.current = null;
    activeAssistantMessageIdRef.current = null;
    assistantAudioEndedRef.current = false;
    lastUserTranscriptRenderAtRef.current = 0;
    lastAssistantRenderAtRef.current = 0;
    setIsPressing(false);
    setIsMenuOpen(false);
    setMessages([]);
    setError(null);
    setPhase("idle");

    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: "stop" });
    }
  }

  const handlePointerDown = async () => {
    if (isAssistantReplyLocked() && phase !== "speaking") return; 
    
    setIsPressing(true);

    if (!micOpenRef.current && phase !== "connecting") {
      setPhase("connecting");
      await openMicrophone();
      startSpeechCapture();
    } else {
      startSpeechCapture();
    }
  };

  const handlePointerUp = () => {
    setIsPressing(false);
    stopSpeechCapture();
  };

  const handlePointerCancel = () => {
    setIsPressing(false);
    stopSpeechCapture();
  };

  const bgImage = phase === "speaking" && teacherGifReady ? PLAY_GIF_SRC : PAUSE_IMAGE_SRC;

  return (
    <main className="voice-qa-shell">
      <img src={PLAY_GIF_SRC} alt="" aria-hidden="true" className="voice-qa-preload-asset" />

      {/* Background Image / GIF */}
      <div 
        className="voice-qa-bg" 
        style={{ backgroundImage: `url(${bgImage})` }} 
      />

      <div className="voice-qa-top-actions" ref={topActionsRef}>
        <button
          type="button"
          className={`voice-qa-top-action ${isMuted ? "is-active" : ""}`}
          onClick={toggleMute}
          aria-label={isMuted ? "取消静音" : "静音"}
          title={isMuted ? "取消静音" : "静音"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <div className="voice-qa-menu-wrap">
          <button
            type="button"
            className={`voice-qa-top-action ${isMenuOpen ? "is-active" : ""}`}
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label="更多操作"
            aria-expanded={isMenuOpen}
            title="更多操作"
          >
            <MoreVertical size={20} />
          </button>

          {isMenuOpen && (
            <div className="voice-qa-dropdown-menu">
              <button
                type="button"
                className="voice-qa-dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsDemoMenuOpen(true);
                }}
              >
                演示模式
              </button>
              <button
                type="button"
                className="voice-qa-dropdown-item"
                onClick={openAgentSettings}
              >
                智能体设置
              </button>
              <button
                type="button"
                className="voice-qa-dropdown-item"
                onClick={clearConversation}
              >
                清理上下文
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 错误提示 - 浮动在内容上方 */}
      {error && (
        <div className="voice-qa-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* 主要内容区 */}
      <section className="voice-qa-content">
        <div className="voice-qa-messages" ref={messagesContainerRef}>
          {messages.map((message) => {
            const showParallelogramDemo =
              message.role === "assistant" && message.demoPreset === "parallelogram";

            return (
              <div
                key={message.id}
                className={`voice-qa-message ${message.role}`}
              >
                <div className="voice-qa-message-bubble">
                  {message.role === "assistant" && (
                    <div className="voice-qa-audio-indicator">
                      <span className="play-icon">▶</span>
                    </div>
                  )}
                  <p className="voice-qa-message-text">
                    {message.content || "..."}
                  </p>
                  {showParallelogramDemo && <ParallelogramDemo />}
                  {message.status === "interrupted" && (
                    <span className="voice-qa-message-tag">已打断</span>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ height: "80px", flexShrink: 0 }} />
        </div>

      </section>

      {/* 底部控制区 */}
      <footer className="voice-qa-footer">
        <button 
          className={`ptt-btn ${isPressing ? "pressing" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        >
          {isPressing ? "松开 结束" : phase === "connecting" ? "连接中..." : "按住 说话"}
        </button>
        <div className="ai-notice">内容由AI生成</div>
      </footer>

      <Modal open={isDemoMenuOpen} onClose={() => setIsDemoMenuOpen(false)} title="选择演示预设">
        <div className="voice-qa-settings-panel">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {DEMO_PRESETS.map(preset => (
              <button
                key={preset.id}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  textAlign: "left",
                  background: demoPreset === preset.id ? "#111827" : "#f1f5f9",
                  color: demoPreset === preset.id ? "#ffffff" : "#111827",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
                onClick={() => {
                  if (demoPreset !== preset.id) {
                    setDemoPreset(preset.id);
                    clearConversation();
                  }
                  setIsDemoMenuOpen(false);
                }}
              >
                {preset.name} {demoPreset === preset.id && " (当前选中)"}
              </button>
            ))}
            {demoPreset && (
              <button
                className="voice-qa-settings-cancel"
                style={{ marginTop: "12px", padding: "12px", width: "100%", fontSize: "16px" }}
                onClick={() => {
                  setDemoPreset(null);
                  setIsDemoMenuOpen(false);
                }}
              >
                取消演示模式
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={isSettingsOpen} onClose={closeAgentSettings} title="智能体设置">
        <div className="voice-qa-settings-panel">
          <label className="voice-qa-settings-label" htmlFor="voice-qa-system-role">
            系统提示词
          </label>
          <textarea
            id="voice-qa-system-role"
            className="voice-qa-settings-textarea"
            value={systemRoleDraft}
            onChange={(event) => setSystemRoleDraft(event.target.value)}
            spellCheck={false}
          />
          <div className="voice-qa-settings-hint">
            保存后，下一轮语音问答会按这里的内容来回答。
          </div>
          <div className="voice-qa-settings-actions">
            <button type="button" className="voice-qa-settings-cancel" onClick={closeAgentSettings}>
              取消
            </button>
            <button type="button" className="voice-qa-settings-save" onClick={saveAgentSettings}>
              保存
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
