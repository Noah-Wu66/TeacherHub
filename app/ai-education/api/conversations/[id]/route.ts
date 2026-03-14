import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, CONVERSATION_FIELDS } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';
import type { Conversation, Message } from '@/lib/ai-education/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 获取单个对话详情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "请先登录" }),
        { status: 401, headers: { "content-type": "application/json", 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "缺少 ID" }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const conversations = await getCollection(COLLECTIONS.conversations);
    const userId = user._id?.toString?.() ?? String(user._id);

    const doc = await conversations.findOne({
      id,
      [CONVERSATION_FIELDS.userId]: userId,
    });

    if (!doc) {
      return new Response(JSON.stringify({ error: "对话不存在" }), { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const normalized: Conversation = {
      id: String(doc.id),
      userId: doc[CONVERSATION_FIELDS.userId] ? String(doc[CONVERSATION_FIELDS.userId]) : undefined,
      title: String(doc[CONVERSATION_FIELDS.title]),
      messages: Array.isArray(doc[CONVERSATION_FIELDS.messages])
        ? doc[CONVERSATION_FIELDS.messages].map((m: any) => ({
          id: String(m.id),
          role: m.role,
          content: String(m.content ?? ''),
          timestamp: new Date(m.timestamp),
          model: m.model,
          images: Array.isArray(m.images) ? m.images : undefined,
          videos: Array.isArray(m.videos) ? m.videos : undefined,
          functionCall: m.functionCall,
          functionResult: m.functionResult,
          metadata: m.metadata,
        })) as Message[]
        : [],
      createdAt: new Date(doc[CONVERSATION_FIELDS.createdAt]),
      updatedAt: new Date(doc[CONVERSATION_FIELDS.updatedAt]),
      model: String(doc[CONVERSATION_FIELDS.model]),
      settings: (doc.settings && typeof doc.settings === 'object') ? doc.settings : {},
      type: doc[CONVERSATION_FIELDS.type] || 'text',
      route: typeof (doc as any)?.route === 'string' ? String((doc as any).route) : undefined,
      dasiZhengke: ((doc as any)?.dasiZhengke && typeof (doc as any).dasiZhengke === 'object') ? {
        topicId: (doc as any).dasiZhengke.topicId ? String((doc as any).dasiZhengke.topicId) : undefined,
        audience: (doc as any).dasiZhengke.audience === 'teacher' ? 'teacher' : ((doc as any).dasiZhengke.audience === 'student' ? 'student' : undefined),
      } : undefined,
    };

    return Response.json(normalized, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return new Response(JSON.stringify({ error: '获取对话详情失败' }), { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

