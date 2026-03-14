'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpenCheck,
  Flag,
  Loader2,
  Sparkles,
  Square,
  Star,
  Send,
  RotateCcw,
} from 'lucide-react';

import type { Message } from '@/lib/ai-education/types';
import { apiFetch } from '@/lib/ai-education/api';
import { cn, generateId } from '@/utils/ai-education/helpers';
import MessageList from '@/components/ai-education/MessageList';
import { useChatStore } from '@/store/ai-education/chatStore';
import {
  DASI_ZHENGKE_TOPICS,
  DEFAULT_DASI_ZHENGKE_TOPIC_ID,
  getDasiZhengkeTopic,
  isDasiZhengkeTopicId,
  type DasiZhengkeAudience,
  type DasiZhengkeTopicId,
} from '@/lib/ai-education/dasiZhengkeTopics';

type LoadedConversation = {
  id: string;
  title?: string;
  messages?: any[];
};

type DasiZhengkeClientProps = {
  basePath: string;
  pageAudience: DasiZhengkeAudience;
};

function buildUrl(basePath: string, params: { id?: string | null; topic?: string | null }) {
  const sp = new URLSearchParams();
  if (params.id) sp.set('id', params.id);
  if (params.topic) sp.set('topic', params.topic);
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function buildDefaultConversationTitle(audience: DasiZhengkeAudience, topicId: DasiZhengkeTopicId) {
  const t = getDasiZhengkeTopic(topicId);
  const audienceLabel = audience === 'teacher' ? '教师' : '学生';
  return `【大思政课·${audienceLabel}】${t.title}｜党的二十届四中全会精神`;
}

function normalizeMessages(raw: any[]): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      const ts = m?.timestamp ? new Date(m.timestamp) : new Date();
      return {
        id: String(m?.id ?? generateId()),
        role: m?.role === 'assistant' ? 'assistant' : (m?.role === 'user' ? 'user' : 'assistant'),
        content: String(m?.content ?? ''),
        timestamp: ts,
        model: m?.model,
        images: Array.isArray(m?.images) ? m.images : undefined,
        videos: Array.isArray(m?.videos) ? m.videos : undefined,
        metadata: (m?.metadata && typeof m.metadata === 'object') ? m.metadata : undefined,
      } as Message;
    })
    .filter((m) => !!m.content);
}

export default function DasiZhengkeClient({
  basePath,
  pageAudience,
}: DasiZhengkeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentModel, settings, modelParams, addConversation } = useChatStore();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<DasiZhengkeTopicId>(DEFAULT_DASI_ZHENGKE_TOPIC_ID);
  const [conversationTitle, setConversationTitle] = useState<string>(
    buildDefaultConversationTitle(pageAudience, DEFAULT_DASI_ZHENGKE_TOPIC_ID)
  );
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [reasoningContent, setReasoningContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const skipNextAutoResolveRef = useRef(false);
  const lastLoadedConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 移动端：避免“导读+对话”上下堆叠导致不可见，改为分屏切换
  const [mobilePanel, setMobilePanel] = useState<'guide' | 'chat'>('chat');
  const mobilePanelInitializedRef = useRef(false);
  useEffect(() => {
    if (mobilePanelInitializedRef.current) return;
    mobilePanelInitializedRef.current = true;
    const hasId = !!searchParams.get('id');
    if (!hasId) setMobilePanel('guide');
  }, [searchParams]);

  const currentTopic = useMemo(() => getDasiZhengkeTopic(topicId), [topicId]);

  const suggestedPrompts = useMemo(() => {
    const basePrompts = pageAudience === 'teacher' ? currentTopic.teacherPrompts : currentTopic.studentPrompts;
    const general = pageAudience === 'teacher'
      ? [
        '请把“党的二十届四中全会精神”转化为本专题可执行的课堂目标与作业要求（给规范表述）。',
        '我会粘贴课堂资料/材料原文：请基于原文做“关键词—解释—例子—总结”，并给出分层提问。',
      ]
      : [
        '我会粘贴材料原文：请按“关键词—解释—例子—总结”帮我读懂，并给一句话总结。',
        '我不懂一个词/一句话：请先解释概念，再举一个生活中的例子帮助我理解。',
      ];
    return [...basePrompts, ...general].slice(0, 8);
  }, [pageAudience, currentTopic]);

  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/ai-education/api/conversations/${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = (await res.json()) as LoadedConversation;
      const normalized = normalizeMessages(Array.isArray(data.messages) ? data.messages : []);
      setConversationId(String(data.id));
      setConversationTitle(String(data.title || buildDefaultConversationTitle(pageAudience, topicId)));
      setMessages(normalized);
      // 让后续逻辑在同一个 tick 内就能读到最新消息，避免“刷新后仍使用旧快照”
      messagesRef.current = normalized;
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [pageAudience, topicId]);

  useEffect(() => {
    const t = searchParams.get('topic');
    const nextTopicId = isDasiZhengkeTopicId(t) ? t : DEFAULT_DASI_ZHENGKE_TOPIC_ID;
    if (nextTopicId !== topicId) setTopicId(nextTopicId);
  }, [searchParams, topicId]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      if (lastLoadedConversationIdRef.current === id) return;
      lastLoadedConversationIdRef.current = id;
      loadConversation(id);
      return;
    }

    lastLoadedConversationIdRef.current = null;
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, [searchParams, loadConversation]);

  const resolveConversationForTopic = useCallback(async (t: DasiZhengkeTopicId) => {
    try {
      const res = await apiFetch(`/ai-education/api/dasi-zhengke/resolve-conversation?topicId=${encodeURIComponent(t)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.id) return String(data.id);
    } catch {
      // ignore
    }
    return null;
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) return;

    // 如果 URL 中有 new=1 参数，表示从主界面点击进入，跳过自动加载历史
    const isNew = searchParams.get('new') === '1';
    if (isNew) {
      // 移除 new 参数，保持 URL 干净
      router.replace(buildUrl(basePath, { topic: topicId }), { scroll: false });
      return;
    }

    if (skipNextAutoResolveRef.current) {
      skipNextAutoResolveRef.current = false;
      return;
    }

    let cancelled = false;

    (async () => {
      setIsResolving(true);
      try {
        const resolvedId = await resolveConversationForTopic(topicId);
        if (cancelled) return;
        if (!resolvedId) return;

        // 避免 URL 更新后重复加载
        lastLoadedConversationIdRef.current = resolvedId;
        await loadConversation(resolvedId);
        router.replace(buildUrl(basePath, { id: resolvedId, topic: topicId }), { scroll: false });
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsResolving(false);
    };
  }, [searchParams, topicId, resolveConversationForTopic, loadConversation, router, basePath]);

  useEffect(() => {
    if (!conversationId && messages.length === 0) {
      setConversationTitle(buildDefaultConversationTitle(pageAudience, topicId));
    }
  }, [conversationId, messages.length, pageAudience, topicId]);

  const createConversationIfNeeded = useCallback(async () => {
    if (conversationId) return conversationId;
    const res = await apiFetch('/ai-education/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: conversationTitle || buildDefaultConversationTitle(pageAudience, topicId),
        model: currentModel,
        type: 'text',
        settings,
        // 标记为大思政课对话，便于 resolve-conversation 按专题查找
        route: 'dasi-zhengke',
        dasiZhengke: {
          topicId,
          audience: pageAudience,
        },
      }),
    });
    if (!res.ok) throw new Error('创建对话失败');
    const data = await res.json();
    if (data?.id) {
      const id = String(data.id);
      setConversationId(id);
      setConversationTitle(String(data.title || conversationTitle || buildDefaultConversationTitle(pageAudience, topicId)));
      addConversation({ ...data, type: 'text' });
      // 跳过下一次 auto-resolve，避免刚创建就又触发查找
      skipNextAutoResolveRef.current = true;
      router.replace(buildUrl(basePath, { id, topic: topicId }), { scroll: false });
      return id;
    }
    throw new Error('创建对话失败');
  }, [conversationId, conversationTitle, currentModel, settings, addConversation, router, basePath, pageAudience, topicId]);

  const releaseStreaming = useCallback(() => {
    setIsStreaming(false);
    setStreamingContent('');
    setReasoningContent('');
  }, []);

  const stopStreaming = useCallback(() => {
    try {
      const controller = abortRef.current;
      if (controller && !controller.signal.aborted) controller.abort();
    } catch { }
    abortRef.current = null;
    releaseStreaming();
  }, [releaseStreaming]);

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text) return;
    if (isStreaming) return;
    if (isLoading || isResolving) return;

    setError(null);

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      model: currentModel,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setStreamingContent('');
    setReasoningContent('');

    try {
      const cid = await createConversationIfNeeded();
      const res = await apiFetch('/ai-education/api/dasi-zhengke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId: cid,
          input: text,
          topicId,
          model: currentModel,
          stream: true,
          settings,
          modelParams,
        }),
      });

      if (!res.ok) {
        let bodyText = '';
        try { bodyText = await res.text(); } catch { }
        try {
          const parsed = JSON.parse(bodyText);
          throw new Error(parsed?.error || '请求失败');
        } catch {
          throw new Error(bodyText || '请求失败');
        }
      }

      const contentType = res.headers.get('Content-Type') || '';
      if (!contentType.includes('text/event-stream')) {
        throw new Error('服务暂不支持流式输出');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');
      const decoder = new TextDecoder();
      let buffer = '';

      let assistantText = '';
      let reasoningText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const sepIndex = buffer.indexOf('\n\n');
          if (sepIndex === -1) break;
          const block = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          const dataLines = block
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => {
              const after = l.slice(5);
              return after.startsWith(' ') ? after.slice(1) : after;
            });
          if (dataLines.length === 0) continue;

          try {
            const payload = dataLines.join('\n');
            const evt = JSON.parse(payload);
            if (evt?.type === 'content') {
              assistantText += String(evt.content || '');
              setStreamingContent(assistantText);
            } else if (evt?.type === 'reasoning') {
              reasoningText += String(evt.content || '');
              setReasoningContent(reasoningText);
            } else if (evt?.type === 'error') {
              throw new Error(String(evt?.error || '生成失败'));
            } else if (evt?.type === 'done') {
              // no-op; handled after loop
            }
          } catch {
            // ignore parse
          }
        }
      }

      // 生成结束后以服务端为准刷新一次，确保 messageId 与数据库一致（后续编辑/删除/重生成才能稳定工作）
      await loadConversation(cid);
    } catch (e: any) {
      const aborted = !!(
        e &&
        (e.name === 'AbortError' ||
          String(e?.message || '').toLowerCase().includes('abort'))
      );
      if (!aborted) setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      abortRef.current = null;
      releaseStreaming();
    }
  }, [
    isStreaming,
    isLoading,
    isResolving,
    currentModel,
    settings,
    modelParams,
    topicId,
    createConversationIfNeeded,
    loadConversation,
    releaseStreaming,
  ]);

  const handleDeleteMessage = useCallback(async (message: Message) => {
    if (!conversationId) return;
    if (isStreaming) return;

    const msgs = messages;
    const idx = msgs.findIndex((m) => m.id === message.id);
    if (idx === -1) return;

    const toDelete: string[] = [message.id];
    if (message.role === 'user' && idx + 1 < msgs.length && msgs[idx + 1].role === 'assistant') {
      toDelete.push(msgs[idx + 1].id);
    }

    setMessages((prev) => prev.filter((m) => !toDelete.includes(m.id)));

    try {
      await apiFetch('/ai-education/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conversationId, op: 'delete_messages', messageIds: toDelete }),
      });
    } catch {
      setError('删除失败，请刷新重试');
      // 回滚为服务端最新状态
      try { await loadConversation(conversationId); } catch { }
    }
  }, [conversationId, isStreaming, messages, loadConversation]);

  const startEditMessage = useCallback((message: Message) => {
    if (!conversationId) return;
    if (isStreaming) return;
    if (message.role !== 'user') return;
    setEditingMessageId(message.id);
  }, [conversationId, isStreaming]);

  const regenerateAssistant = useCallback(async (assistantMsg: Message, forcedUserContent?: string) => {
    if (!conversationId) return;
    if (isStreaming) return;
    if (isLoading || isResolving) return;

    const userContent = String(forcedUserContent || '').trim();
    let resolvedUserContent = userContent;
    if (!resolvedUserContent) {
      const msgs = messagesRef.current;
      const aIdx = msgs.findIndex((m) => m.id === assistantMsg.id);
      if (aIdx === -1) {
        setError('未找到对应的消息位置，无法重新生成');
        return;
      }

      let userMsg: Message | null = null;
      for (let i = aIdx - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') { userMsg = msgs[i]; break; }
      }
      if (!userMsg) {
        setError('未找到对应的用户消息，无法重新生成');
        return;
      }
      resolvedUserContent = String(userMsg.content || '').trim();
    }
    if (!resolvedUserContent) return;

    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setStreamingContent('');
    setReasoningContent('');

    // 先清空目标消息内容，让用户知道正在重生成
    setMessages((prev) => prev.map((m) => (
      m.id === assistantMsg.id ? { ...m, content: '', metadata: undefined } : m
    )));

    try {
      const res = await apiFetch('/ai-education/api/dasi-zhengke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId,
          input: resolvedUserContent,
          topicId,
          model: currentModel,
          stream: true,
          settings,
          modelParams,
          regenerate: true,
          targetMessageId: assistantMsg.id,
        }),
      });

      if (!res.ok) {
        let bodyText = '';
        try { bodyText = await res.text(); } catch { }
        try {
          const parsed = JSON.parse(bodyText);
          throw new Error(parsed?.error || '请求失败');
        } catch {
          throw new Error(bodyText || '请求失败');
        }
      }

      const contentType = res.headers.get('Content-Type') || '';
      if (!contentType.includes('text/event-stream')) throw new Error('服务暂不支持流式输出');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');
      const decoder = new TextDecoder();
      let buffer = '';

      let assistantText = '';
      let reasoningText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const sepIndex = buffer.indexOf('\n\n');
          if (sepIndex === -1) break;
          const block = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          const dataLines = block
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => {
              const after = l.slice(5);
              return after.startsWith(' ') ? after.slice(1) : after;
            });
          if (dataLines.length === 0) continue;

          try {
            const payload = dataLines.join('\n');
            const evt = JSON.parse(payload);
            if (evt?.type === 'content') {
              assistantText += String(evt.content || '');
              setStreamingContent(assistantText);
            } else if (evt?.type === 'reasoning') {
              reasoningText += String(evt.content || '');
              setReasoningContent(reasoningText);
            } else if (evt?.type === 'error') {
              throw new Error(String(evt?.error || '生成失败'));
            }
          } catch {
            // ignore parse
          }
        }
      }

      // 把最终内容写回目标消息（并刷新一次服务端状态）
      setMessages((prev) => prev.map((m) => (
        m.id === assistantMsg.id
          ? { ...m, content: assistantText, metadata: reasoningText ? { reasoning: reasoningText } : undefined }
          : m
      )));
      await loadConversation(conversationId);
    } catch (e: any) {
      const aborted = !!(
        e &&
        (e.name === 'AbortError' ||
          String(e?.message || '').toLowerCase().includes('abort'))
      );
      if (!aborted) setError(e instanceof Error ? e.message : '重新生成失败');
      try { await loadConversation(conversationId); } catch { }
    } finally {
      abortRef.current = null;
      releaseStreaming();
    }
  }, [
    conversationId,
    isStreaming,
    isLoading,
    isResolving,
    topicId,
    currentModel,
    settings,
    modelParams,
    loadConversation,
    releaseStreaming,
  ]);

  const confirmEditAndRegenerate = useCallback(async (nextContent: string) => {
    if (!conversationId) return;
    if (!editingMessageId) return;
    if (isStreaming) return;

    const trimmed = String(nextContent || '').trim();
    if (!trimmed) return;

    setError(null);

    const editId = editingMessageId;

    // 本地先更新用户消息
    setMessages((prev) => prev.map((m) => (
      m.id === editId ? { ...m, content: trimmed } : m
    )));

    try {
      await apiFetch('/ai-education/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          op: 'update_message',
          messageId: editId,
          updates: { content: trimmed },
        }),
      });
    } catch {
      // 同步失败则刷新一次恢复一致性
      try { await loadConversation(conversationId); } catch { }
      setError('编辑保存失败，请刷新重试');
      return;
    } finally {
      setEditingMessageId(null);
    }

    // 找到该用户消息后面的第一条助手消息：对它做“重生成”
    const currentMsgs = messagesRef.current;
    const uIdx = currentMsgs.findIndex((m) => m.id === editId);
    let targetAssistant: Message | null = null;
    if (uIdx !== -1 && uIdx + 1 < currentMsgs.length && currentMsgs[uIdx + 1].role === 'assistant') {
      targetAssistant = currentMsgs[uIdx + 1];
    }

    if (targetAssistant) {
      await regenerateAssistant(targetAssistant, trimmed);
      return;
    }

    // 没有助手回复：插入一个占位助手消息，再对它进行重生成
    const placeholder: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: currentModel,
    };
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === editId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx + 1, 0, placeholder);
      return next;
    });
    try {
      await apiFetch('/ai-education/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          op: 'insert_message_after',
          afterMessageId: editId,
          message: placeholder,
        }),
      });
      await regenerateAssistant(placeholder, trimmed);
    } catch {
      setError('编辑后生成失败，请刷新重试');
      try { await loadConversation(conversationId); } catch { }
    }
  }, [
    conversationId,
    editingMessageId,
    isStreaming,
    currentModel,
    loadConversation,
    regenerateAssistant,
  ]);

  const startNew = useCallback(() => {
    stopStreaming();
    setConversationId(null);
    setConversationTitle(buildDefaultConversationTitle(pageAudience, topicId));
    setMessages([]);
    setInput('');
    setError(null);
    setEditingMessageId(null);
    setMobilePanel('chat');
    lastLoadedConversationIdRef.current = null;
    skipNextAutoResolveRef.current = true;
    router.replace(buildUrl(basePath, { topic: topicId }), { scroll: false });
  }, [router, stopStreaming, basePath, pageAudience, topicId]);

  const selectTopic = useCallback((nextTopicId: DasiZhengkeTopicId) => {
    if (nextTopicId === topicId) return;
    if (isStreaming) return; // 生成中禁止切换专题
    stopStreaming();
    setError(null);
    setEditingMessageId(null);

    // 切换题目后进入该题目的“独立讨论区”：清空当前对话，并通过自动解析加载该题目最新历史
    setTopicId(nextTopicId);
    setConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setReasoningContent('');
    setInput('');

    lastLoadedConversationIdRef.current = null;
    router.replace(buildUrl(basePath, { topic: nextTopicId }), { scroll: false });
  }, [topicId, isStreaming, stopStreaming, router, basePath]);

  return (
    <div className="min-h-[100dvh] h-[100dvh] overflow-hidden bg-background flex flex-col">
      {/* 顶栏 */}
      <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe-area-inset-top">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/ai-education"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="返回主页"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  <Star className="h-3.5 w-3.5" />
                  大思政课
                </span>
                <span className="text-sm font-medium truncate">{conversationTitle}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                依托“家门口的思政教育基地”“大中小学实景课堂” · 专题：{currentTopic.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            title="开始新的专题对话"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">新对话</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 h-full flex flex-col gap-4 min-h-0">
          {/* 移动端：导读 / 对话切换 */}
          <div className="lg:hidden">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setMobilePanel('guide')}
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    mobilePanel === 'guide'
                      ? "bg-red-600 text-white"
                      : "bg-background/40 text-foreground hover:bg-accent"
                  )}
                  aria-pressed={mobilePanel === 'guide'}
                >
                  导读与专题
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePanel('chat')}
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    mobilePanel === 'chat'
                      ? "bg-red-600 text-white"
                      : "bg-background/40 text-foreground hover:bg-accent"
                  )}
                  aria-pressed={mobilePanel === 'chat'}
                >
                  对话交流
                </button>
              </div>
            </div>
          </div>

        {/* 英雄区 */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl border border-red-500/15 bg-gradient-to-r from-red-800 via-red-700 to-orange-600 text-white",
          mobilePanel === 'chat' && "hidden lg:block"
        )}>
          <div className="absolute inset-0 opacity-25">
            <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          </div>
          <div className="relative px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white/90">
              <Flag className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wide">
                {pageAudience === 'teacher' ? '教学研讨 · 备课支持' : '专题学习 · 交流研讨'}
              </span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                  大思政课专题：{currentTopic.title}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-white/85 max-w-3xl">
                  {currentTopic.heroDescription}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  {pageAudience === 'teacher' ? '以育人为中心' : '以学习为中心'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  导读与任务
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 主体：导读 + 对话 */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* 左侧导读 */}
          <div
            className={cn(
              "lg:col-span-2 flex-col gap-4 min-h-0 overflow-y-auto scrollbar-thin touch-scroll pr-1 pb-2",
              mobilePanel === 'guide' ? "flex" : "hidden",
              "lg:flex"
            )}
          >
            {/* 专题卡片 */}
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">专题题目</h3>
                <span className="text-[11px] text-muted-foreground">点击切换导读与推荐提问</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {DASI_ZHENGKE_TOPICS.map((t) => {
                  const selected = t.id === topicId;
                  const canSwitch = !isStreaming && !selected;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTopic(t.id)}
                      disabled={isStreaming}
                      className={cn(
                        "w-full rounded-xl border p-3 transition-colors text-left flex flex-col gap-1 !items-start !justify-start",
                        selected
                          ? "border-red-500/30 bg-red-500/10"
                          : canSwitch
                            ? "border-border bg-background/40 hover:bg-accent"
                            : "border-border bg-background/40 opacity-50 cursor-not-allowed"
                      )}
                      aria-pressed={selected}
                      title={isStreaming ? "生成中，请稍候" : "切换专题"}
                    >
                      <div className="text-xs font-semibold text-foreground">{t.title}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        {t.subtitle}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.highlightBases.map((b) => (
                          <span
                            key={`${t.id}-${b}`}
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                              selected
                                ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
                                : "border-border bg-background/50 text-muted-foreground"
                            )}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <Flag className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold">{pageAudience === 'teacher' ? '教学导读' : '学习导读'}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    这不是背诵打卡区，而是“读懂—会说—能写—会联系实际”的实景课堂学习讨论区。
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-xs font-semibold text-foreground">
                    {pageAudience === 'teacher' ? '教学目标' : '学习目标'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {pageAudience === 'teacher' ? currentTopic.teacherGuide.goal : currentTopic.studentGuide.goal}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-xs font-semibold text-foreground">
                    {pageAudience === 'teacher' ? '组织方法' : '学习方法'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {pageAudience === 'teacher' ? currentTopic.teacherGuide.method : currentTopic.studentGuide.method}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-xs font-semibold text-foreground">任务建议</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {pageAudience === 'teacher' ? currentTopic.teacherGuide.task : currentTopic.studentGuide.task}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
              <h3 className="text-sm font-semibold">
                {pageAudience === 'teacher' ? '推荐提问（备课/课堂）' : '推荐提问'}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setInput(p);
                      setMobilePanel('chat');
                    }}
                    className="w-full sm:w-auto rounded-xl sm:rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors text-left !justify-start"
                    title="点击填入输入框"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧对话 */}
          <div
            className={cn(
              "lg:col-span-3 flex-col min-h-0 rounded-2xl border border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden",
              mobilePanel === 'chat' ? "flex" : "hidden",
              "lg:flex"
            )}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {pageAudience === 'teacher' ? '研讨交流区' : '讨论交流区'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  输入材料段落/关键词/问题 · AI 会帮助你梳理要点并形成表达
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    加载中
                  </span>
                )}
                {isResolving && !isLoading && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    切换中
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 border-b border-destructive/30 bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col">
              <MessageList
                messages={messages}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                reasoningContent={reasoningContent}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={startEditMessage}
                editingMessageId={editingMessageId}
                onCancelEdit={() => setEditingMessageId(null)}
                onConfirmEdit={(content) => confirmEditAndRegenerate(content)}
                onRegenerateAssistant={regenerateAssistant}
              />
            </div>

            {/* 输入区 */}
            <div className="border-t border-border px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0)+0.75rem)]">
              <div className={cn(
                "relative rounded-2xl border border-input bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                "focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500/30"
              )}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="输入你想讨论的内容（可粘贴材料原文、关键词或学习心得）…"
                  className="chat-input w-full border-0 bg-transparent focus:ring-0 resize-none pr-24 sm:pr-28 pl-4 py-3 rounded-2xl"
                  disabled={isLoading || isResolving}
                  rows={1}
                />

                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stopStreaming}
                      className="rounded-xl px-3 py-2 text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      title="停止生成"
                    >
                      <Square className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage(input)}
                      className="rounded-xl px-3 py-2 text-xs font-semibold bg-red-600 text-white hover:bg-red-600/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      disabled={!input.trim() || isLoading || isResolving}
                      title="发送 (Enter)"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">
                提示：按 Enter 发送，Shift+Enter 换行。把不懂的词或材料原文贴上来效果更好。
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

