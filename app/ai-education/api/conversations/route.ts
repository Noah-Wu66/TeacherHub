import { NextRequest } from 'next/server';
import { generateId } from '@/utils/ai-education/helpers';
import { getCollection } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, CONVERSATION_FIELDS } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';
import type { Conversation } from '@/lib/ai-education/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 获取对话列表
export async function GET(req: NextRequest) {
  try {
    // 验证用户登录
    const user = await requireUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "请先登录" }),
        { status: 401, headers: { "content-type": "application/json", 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const conversations = await getCollection(COLLECTIONS.conversations);
    const userId = user._id?.toString?.() ?? String(user._id);

    // 优化：移除重复的清理操作，这会严重拖慢查询速度

    const query: any = {
      [CONVERSATION_FIELDS.userId]: userId,
      // 优化：仅查询包含消息的对话，减少数据传输
      [`${CONVERSATION_FIELDS.messages}.0`]: { $exists: true }
    };
    if (search && search.trim()) {
      query[CONVERSATION_FIELDS.title] = { $regex: search.trim(), $options: 'i' };
    }
    const list = await conversations.aggregate([
      { $match: query },
      { $sort: { [CONVERSATION_FIELDS.updatedAt]: -1 } },
      {
        $addFields: {
          messageCount: { $size: `$${CONVERSATION_FIELDS.messages}` }
        }
      },
      {
        $project: {
          [CONVERSATION_FIELDS.messages]: 0
        }
      }
    ]).toArray();
    const normalized: Conversation[] = (Array.isArray(list) ? list : []).map((d: any) => ({
      id: String(d.id),
      userId: d[CONVERSATION_FIELDS.userId] ? String(d[CONVERSATION_FIELDS.userId]) : undefined,
      title: String(d[CONVERSATION_FIELDS.title]),
      messages: [], // 列表不再返回消息详情
      messageCount: typeof d.messageCount === 'number' ? d.messageCount : 0,
      createdAt: new Date(d[CONVERSATION_FIELDS.createdAt]),
      updatedAt: new Date(d[CONVERSATION_FIELDS.updatedAt]),
      model: String(d[CONVERSATION_FIELDS.model]),
      settings: (d.settings && typeof d.settings === 'object') ? d.settings : {},
      type: d[CONVERSATION_FIELDS.type] || 'text', // 默认为文本对话
      route: typeof d.route === 'string' ? d.route : undefined,
      dasiZhengke: (d.dasiZhengke && typeof d.dasiZhengke === 'object') ? {
        topicId: d.dasiZhengke.topicId ? String(d.dasiZhengke.topicId) : undefined,
        audience: d.dasiZhengke.audience === 'teacher' ? 'teacher' : (d.dasiZhengke.audience === 'student' ? 'student' : undefined),
      } : undefined,
    }));
    return Response.json(normalized, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return new Response(JSON.stringify({ error: '获取对话列表失败' }), { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

// 创建新对话
export async function POST(req: NextRequest) {
  try {
    // 验证用户登录
    const user = await requireUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "请先登录" }),
        { status: 401, headers: { "content-type": "application/json", 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    const body = await req.json();
    const conversations = await getCollection(COLLECTIONS.conversations);
    const userId = user._id?.toString?.() ?? String(user._id);
    const id = generateId();
    const now = new Date();
    const conversationType = body.type || 'text'; // 默认为文本对话
    const doc: any = {
      id,
      [CONVERSATION_FIELDS.userId]: userId,
      [CONVERSATION_FIELDS.title]: body.title || '新对话',
      [CONVERSATION_FIELDS.messages]: body.messages || [],
      [CONVERSATION_FIELDS.createdAt]: now,
      [CONVERSATION_FIELDS.updatedAt]: now,
      [CONVERSATION_FIELDS.model]: body.model,
      [CONVERSATION_FIELDS.type]: conversationType,
      settings: body.settings || {},
    };
    // 支持大思政课等专题路由元数据
    if (body.route && typeof body.route === 'string') {
      doc.route = body.route;
    }
    if (body.dasiZhengke && typeof body.dasiZhengke === 'object') {
      doc.dasiZhengke = body.dasiZhengke;
    }
    await conversations.insertOne(doc);
    const out: Conversation = {
      id: String(doc.id),
      title: String(doc[CONVERSATION_FIELDS.title]),
      messages: body.messages || [],
      createdAt: new Date(doc[CONVERSATION_FIELDS.createdAt]),
      updatedAt: new Date(doc[CONVERSATION_FIELDS.updatedAt]),
      model: String(doc[CONVERSATION_FIELDS.model]),
      settings: (doc.settings && typeof doc.settings === 'object') ? doc.settings : {},
      type: conversationType,
      route: doc.route,
      dasiZhengke: doc.dasiZhengke,
    };
    return Response.json(out, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return new Response(JSON.stringify({ error: '创建对话失败' }), { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

// 更新对话标题
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "请先登录" }),
        { status: 401, headers: { "content-type": "application/json", 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
    const { id, title } = await req.json();
    const conversations = await getCollection(COLLECTIONS.conversations);
    const userId = user._id?.toString?.() ?? String(user._id);
    await conversations.updateOne(
      { id, [CONVERSATION_FIELDS.userId]: userId },
      { $set: { [CONVERSATION_FIELDS.title]: title } }
    );
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return new Response(JSON.stringify({ error: '更新对话标题失败' }), { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

// 删除对话
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "请先登录" }),
        { status: 401, headers: { "content-type": "application/json", 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: '缺少 id' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

    const conversations = await getCollection(COLLECTIONS.conversations);
    const userId = user._id?.toString?.() ?? String(user._id);
    await conversations.deleteOne({ id, [CONVERSATION_FIELDS.userId]: userId });
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return new Response(JSON.stringify({ error: '删除对话失败' }), { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

// 局部更新：按消息ID截断（不含该消息）
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "请先登录" }),
        { status: 401, headers: { "content-type": "application/json", 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
    const body = await req.json();
    const { id, op } = body;
    if (!id || !op) return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

    const conversations = await getCollection(COLLECTIONS.conversations);
    const userId = user._id?.toString?.() ?? String(user._id);

    // 操作：添加消息
    if (op === 'add_message') {
      const { message } = body;
      if (!message) return new Response(JSON.stringify({ error: '缺少 message' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

      await conversations.updateOne(
        { id, [CONVERSATION_FIELDS.userId]: userId },
        {
          $push: {
            [CONVERSATION_FIELDS.messages]: {
              ...message,
              timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
            }
          } as any,
          $set: { [CONVERSATION_FIELDS.updatedAt]: new Date() }
        }
      );
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 操作：在指定消息后插入消息
    if (op === 'insert_message_after') {
      const { afterMessageId, message } = body;
      if (!afterMessageId || !message) return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

      const doc: any = await conversations.findOne(
        { id, [CONVERSATION_FIELDS.userId]: userId },
        { projection: { [CONVERSATION_FIELDS.messages]: 1 } }
      );
      if (!doc) return new Response(JSON.stringify({ error: '对话不存在' }), { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

      const list: any[] = Array.isArray(doc[CONVERSATION_FIELDS.messages]) ? doc[CONVERSATION_FIELDS.messages] : [];
      const idx = list.findIndex((m: any) => String(m?.id) === String(afterMessageId));
      if (idx === -1) return new Response(JSON.stringify({ error: '消息不存在' }), { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

      // 在 idx 后面插入新消息
      const newMessage = {
        ...message,
        timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
      };
      list.splice(idx + 1, 0, newMessage);

      await conversations.updateOne(
        { id, [CONVERSATION_FIELDS.userId]: userId },
        { $set: { [CONVERSATION_FIELDS.messages]: list, [CONVERSATION_FIELDS.updatedAt]: new Date() } }
      );
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 操作：更新消息
    if (op === 'update_message') {
      const { messageId, updates } = body;
      if (!messageId || !updates) return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

      const updateFields: any = {};
      for (const [key, value] of Object.entries(updates)) {
        updateFields[`${CONVERSATION_FIELDS.messages}.$.${key}`] = value;
      }
      updateFields[CONVERSATION_FIELDS.updatedAt] = new Date();

      await conversations.updateOne(
        { id, [CONVERSATION_FIELDS.userId]: userId, [`${CONVERSATION_FIELDS.messages}.id`]: messageId },
        { $set: updateFields }
      );
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    if (op === 'truncate_before') {
      const { messageId } = body;
      if (!messageId) return new Response(JSON.stringify({ error: '缺少 messageId' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

      const doc: any = await conversations.findOne(
        { id, [CONVERSATION_FIELDS.userId]: userId },
        { projection: { [CONVERSATION_FIELDS.messages]: 1 } }
      );
      if (!doc) return new Response(JSON.stringify({ error: '对话不存在' }), { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
      const list: any[] = Array.isArray(doc[CONVERSATION_FIELDS.messages]) ? doc[CONVERSATION_FIELDS.messages] : [];
      const idx = list.findIndex((m: any) => String(m?.id) === String(messageId));
      if (idx === -1) return new Response(JSON.stringify({ error: '消息不存在' }), { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
      const truncated = list.slice(0, idx);
      await conversations.updateOne(
        { id, [CONVERSATION_FIELDS.userId]: userId },
        { $set: { [CONVERSATION_FIELDS.messages]: truncated, [CONVERSATION_FIELDS.updatedAt]: new Date() } }
      );
      return Response.json({ ok: true, truncatedCount: list.length - truncated.length }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 操作：删除消息（支持批量删除）
    if (op === 'delete_messages') {
      const { messageIds } = body;
      if (!messageIds || !Array.isArray(messageIds)) return new Response(JSON.stringify({ error: '缺少 messageIds' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

      await conversations.updateOne(
        { id, [CONVERSATION_FIELDS.userId]: userId },
        {
          $pull: { [CONVERSATION_FIELDS.messages]: { id: { $in: messageIds } } } as any,
          $set: { [CONVERSATION_FIELDS.updatedAt]: new Date() }
        }
      );
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    return new Response(JSON.stringify({ error: '不支持的操作' }), { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

  } catch {
    return new Response(JSON.stringify({ error: '操作对话失败' }), { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}