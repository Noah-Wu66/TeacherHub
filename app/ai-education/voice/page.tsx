'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { Phone, Square, ArrowLeft, Volume2, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/ai-education/api';
import { useChatStore } from '@/store/ai-education/chatStore';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    audioUrl?: string;
    id?: string;
};

function VoicePageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addConversation } = useChatStore();

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversationTitle, setConversationTitle] = useState<string>('语音通话');
    const [isLoading, setIsLoading] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const skipNextAutoLoadRef = useRef(false);

    const MAX_RECORDING_DURATION = 30000; // 30秒

    // 从 URL 获取对话 ID 并加载历史
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setConversationId(id);
            if (skipNextAutoLoadRef.current) {
                skipNextAutoLoadRef.current = false;
                return;
            }
            loadConversation(id);
        }
    }, [searchParams]);

    // 加载对话历史
    const loadConversation = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await apiFetch(`/ai-education/api/conversations/${id}`);
            if (response.ok) {
                const data = await response.json();
                setConversationTitle(data.title || '语音通话');
                // 转换消息格式
                const loadedMessages: Message[] = data.messages.map((m: any) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                    id: m.id,
                }));
                setMessages(loadedMessages);
            }
        } catch (err) {
            console.error('Failed to load conversation:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // 创建新的语音对话
    const createVoiceConversation = async (firstUserText: string): Promise<string | null> => {
        try {
            const title = firstUserText.slice(0, 20) + (firstUserText.length > 20 ? '...' : '');
            const response = await apiFetch('/ai-education/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    model: 'voice-chat',
                    type: 'voice',
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setConversationId(data.id);
                setConversationTitle(data.title);
                // 更新 URL
                skipNextAutoLoadRef.current = true;
                router.replace(`/voice?id=${data.id}`, { scroll: false });
                // 添加到侧边栏列表
                addConversation({ ...data, type: 'voice' });
                return data.id;
            }
        } catch (err) {
            console.error('Failed to create conversation:', err);
        }
        return null;
    };

    // 开始新对话
    const startNewConversation = () => {
        setConversationId(null);
        setMessages([]);
        setConversationTitle('语音通话');
        setError(null);
        router.replace('/voice', { scroll: false });
    };

    // 自动滚动到底部
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // 消息变化时滚动到底部
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Safari 需要在用户交互时预先初始化音频
    const initAudioForSafari = useCallback(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            audioRef.current.play().catch(() => { });
        }
    }, []);

    // 开始录音
    const startRecording = async () => {
        try {
            setError(null);
            initAudioForSafari();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 16000,
            });

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                await processAudio();
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);

            recordingTimeoutRef.current = setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                }
            }, MAX_RECORDING_DURATION);
        } catch (err: any) {
            setError('无法访问麦克风，请授权后重试');
            console.error('Recording error:', err);
        }
    };

    // 停止录音
    const stopRecording = useCallback(() => {
        if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
        }
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // 处理录音
    const processAudio = async () => {
        if (audioChunksRef.current.length === 0) return;

        setIsProcessing(true);
        setError(null);

        // 生成唯一 ID 标识这条消息
        const msgId = Date.now().toString();

        // 添加用户消息占位（新的气泡）
        setMessages(prev => [...prev, { role: 'user', content: '正在识别...', id: msgId }]);

        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const base64 = await blobToBase64(audioBlob);

            // 构建历史消息（不包含当前占位消息）
            setMessages(currentMessages => {
                // 使用最新的 messages 状态来构建历史
                const historyForApi = currentMessages
                    .filter(m => m.content !== '正在识别...')
                    .map(m => ({ role: m.role, content: m.content }));

                // 异步发送请求
                (async () => {
                    try {
                        // 如果没有对话ID，先创建一个空对话占位
                        let currentConvId = conversationId;

                        // 发送语音识别请求，带上 conversationId（如果有的话）
                        const chatResponse = await apiFetch('/ai-education/api/voice-chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                audio: base64,
                                mimeType: 'audio/webm',
                                history: historyForApi,
                                conversationId: currentConvId,
                            }),
                        });

                        if (!chatResponse.ok) {
                            const data = await chatResponse.json();
                            throw new Error(data.error || '语音处理失败');
                        }

                        const { userText, text } = await chatResponse.json();

                        // 如果没有对话ID，创建对话并保存消息
                        if (!currentConvId && userText) {
                            currentConvId = await createVoiceConversation(userText);
                            // 创建后手动保存这轮消息
                            if (currentConvId) {
                                try {
                                    await apiFetch('/ai-education/api/conversations', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            id: currentConvId,
                                            op: 'add_message',
                                            message: { id: msgId, role: 'user', content: userText },
                                        }),
                                    });
                                    await apiFetch('/ai-education/api/conversations', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            id: currentConvId,
                                            op: 'add_message',
                                            message: { id: msgId + '_reply', role: 'assistant', content: text },
                                        }),
                                    });
                                } catch {
                                    // 忽略保存错误
                                }
                            }
                        }

                        // 使用 ID 更新用户消息为识别结果
                        setMessages(prev => prev.map(m =>
                            m.id === msgId
                                ? { ...m, content: userText || '（未识别到语音）' }
                                : m
                        ));

                        // 获取 TTS 音频
                        const ttsResponse = await apiFetch('/ai-education/api/tts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text }),
                        });

                        let audioUrl: string | undefined;
                        if (ttsResponse.ok) {
                            const ttsData = await ttsResponse.json();
                            audioUrl = ttsData.audio;
                        }

                        // 添加助手消息（新的气泡）
                        setMessages(prev => [...prev, { role: 'assistant', content: text, audioUrl }]);

                        // 自动播放
                        if (audioUrl) {
                            playAudio(audioUrl);
                        }
                    } catch (err: any) {
                        setError(err.message || '处理失败');
                        // 移除失败的用户消息占位（使用 ID）
                        setMessages(prev => prev.filter(m => m.id !== msgId));
                    } finally {
                        setIsProcessing(false);
                    }
                })();

                return currentMessages;
            });
        } catch (err: any) {
            setError(err.message || '处理失败');
            setMessages(prev => prev.filter(m => m.id !== msgId));
            setIsProcessing(false);
        }
    };

    // Blob 转 Base64
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // 播放音频
    const playAudio = useCallback((url: string) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = url;
            setIsPlaying(true);
            audioRef.current.onended = () => setIsPlaying(false);
            audioRef.current.onerror = () => setIsPlaying(false);
            audioRef.current.play().catch(() => setIsPlaying(false));
        } else {
            const audio = new Audio(url);
            audioRef.current = audio;
            setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => setIsPlaying(false);
            audio.play().catch(() => setIsPlaying(false));
        }
    }, []);

    // 清理
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return (
        <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/30 overflow-hidden">
            {/* 顶栏 - 固定 */}
            <header className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-sm z-10 pt-safe-area-inset-top">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/ai-education"
                            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-semibold truncate">{conversationTitle}</h1>
                            {conversationId && (
                                <p className="text-xs text-muted-foreground">语音通话记录</p>
                            )}
                        </div>
                    </div>
                    {/* 新建对话按钮 */}
                    <button
                        onClick={startNewConversation}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="新建语音通话"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* 消息区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground py-12">
                            <p>加载中...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            <Image src="/ai-education/call.png" alt="语音通话" width={48} height={48} className="mx-auto mb-4 object-contain" />
                            <p>点击下方按钮开始语音对话</p>
                        </div>
                    ) : null}

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                    }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                {msg.audioUrl && msg.role === 'assistant' && (
                                    <button
                                        onClick={() => playAudio(msg.audioUrl!)}
                                        className="mt-2 flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                                    >
                                        <Volume2 className="h-3 w-3" />
                                        重新播放
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-2xl px-4 py-3">
                                <p className="text-sm text-muted-foreground">正在处理...</p>
                            </div>
                        </div>
                    )}

                    {/* 滚动锚点 */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 pb-2">
                    <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2">
                        {error}
                    </div>
                </div>
            )}

            {/* 底部控制栏 - 固定 */}
            <div className="flex-shrink-0 border-t border-border bg-background/80 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex justify-center">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing || isPlaying}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
                            ${isRecording
                                ? 'bg-destructive text-destructive-foreground animate-pulse'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }
                            ${(isProcessing || isPlaying) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isRecording ? (
                            <Square className="h-8 w-8" />
                        ) : (
                            <Phone className="h-8 w-8" />
                        )}
                    </button>
                </div>
                <p className="text-center text-sm text-muted-foreground pb-4">
                    {isRecording ? '点击停止录音' : isProcessing ? '处理中...' : isPlaying ? '正在播放...' : '点击开始录音'}
                </p>
            </div>
        </div>
    );
}

export default function VoicePage() {
    return (
        <Suspense
            fallback={
                <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
                    <div className="text-sm text-muted-foreground">加载中...</div>
                </div>
            }
        >
            <VoicePageInner />
        </Suspense>
    );
}
