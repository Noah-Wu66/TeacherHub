import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, CONVERSATION_FIELDS } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';
import { getDasiZhengkeTopic } from '@/lib/ai-education/dasiZhengkeTopics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  }

  const { searchParams } = new URL(req.url);
  const topicParam = searchParams.get('topicId');
  const topic = getDasiZhengkeTopic(topicParam);

  const userRole = String((user as any)?.role || 'user');
  const isTeacherOrAdmin = ['teacher', 'admin', 'superadmin'].includes(userRole);
  const audience = isTeacherOrAdmin ? 'teacher' : 'student';

  const conversations = await getCollection(COLLECTIONS.conversations);
  const userId = user._id?.toString?.() ?? String(user._id);

  const query: any = {
    [CONVERSATION_FIELDS.userId]: userId,
    route: 'dasi-zhengke',
    'dasiZhengke.topicId': topic.id,
    'dasiZhengke.audience': audience,
    [`${CONVERSATION_FIELDS.messages}.0`]: { $exists: true },
  };

  try {
    const doc: any = await conversations.findOne(query, {
      sort: { [CONVERSATION_FIELDS.updatedAt]: -1 } as any,
      projection: { id: 1, [CONVERSATION_FIELDS.title]: 1 } as any,
    });

    if (!doc?.id) {
      return new Response(JSON.stringify({ id: null, topicId: topic.id }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    return new Response(
      JSON.stringify({
        id: String(doc.id),
        title: doc[CONVERSATION_FIELDS.title] ? String(doc[CONVERSATION_FIELDS.title]) : undefined,
        topicId: topic.id,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: '获取专题对话失败' }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  }
}


