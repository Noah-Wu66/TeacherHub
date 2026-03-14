import { EJSON } from 'bson';
import { getDb } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, USER_FIELDS, USER_ROLES } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXPORT_COLLECTIONS = [
  COLLECTIONS.users,
  COLLECTIONS.sessions,
  COLLECTIONS.videoCards,
  COLLECTIONS.imageCards,
  COLLECTIONS.imageAssets,
  COLLECTIONS.authCodes,
  COLLECTIONS.conversations,
  COLLECTIONS.usageStats,
] as const;

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return errorResponse('未登录', 401);
    if (user[USER_FIELDS.role] !== USER_ROLES.superadmin) {
      return errorResponse('权限不足', 403);
    }

    const db = await getDb();
    const collections: Record<string, unknown[]> = {};

    for (const name of EXPORT_COLLECTIONS) {
      collections[name] = await db.collection(name).find({}).toArray();
    }

    const payload = JSON.stringify(
      EJSON.serialize(
        {
          version: 1,
          exportedAt: new Date(),
          collections,
        },
        { relaxed: false }
      ),
      null,
      2
    );

    const filename = `ai-education-data-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(payload, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch {
    return errorResponse('导出失败', 500);
  }
}
