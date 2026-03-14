import { NextResponse } from 'next/server';
import { getDb } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, USER_FIELDS, USER_ROLES } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return json({ message: '未登录' }, 401);
    if (user[USER_FIELDS.role] !== USER_ROLES.superadmin) {
      return json({ message: '权限不足' }, 403);
    }

    const db = await getDb();
    const totalCount = await db.collection(COLLECTIONS.conversations).countDocuments();

    return json({ totalCount });
  } catch {
    return json({ message: '获取历史记录统计失败' }, 500);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    if (!user) return json({ message: '未登录' }, 401);
    if (user[USER_FIELDS.role] !== USER_ROLES.superadmin) {
      return json({ message: '权限不足' }, 403);
    }

    const db = await getDb();
    const result = await db.collection(COLLECTIONS.conversations).deleteMany({});

    return json({
      message: `已清理 ${result.deletedCount} 条历史记录`,
      deletedCount: result.deletedCount,
    });
  } catch {
    return json({ message: '清理历史记录失败' }, 500);
  }
}
