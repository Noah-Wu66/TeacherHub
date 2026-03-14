import { EJSON } from 'bson';
import { getDb, supportsTransactions } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, USER_FIELDS, USER_ROLES } from '@/lib/ai-education/models';
import { requireUser } from '@/lib/ai-education/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMPORT_COLLECTIONS = [
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

async function replaceCollections(
  db: Awaited<ReturnType<typeof getDb>>,
  collections: Record<string, unknown[]>,
  session?: any
) {
  for (const name of IMPORT_COLLECTIONS) {
    const docs = Array.isArray(collections[name]) ? collections[name] : [];
    await db.collection(name).deleteMany({}, session ? { session } : undefined);
    if (docs.length > 0) {
      await db.collection(name).insertMany(docs as any[], session ? { session } : undefined);
    }
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return errorResponse('未登录', 401);
    if (user[USER_FIELDS.role] !== USER_ROLES.superadmin) {
      return errorResponse('权限不足', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof (file as File).text !== 'function') {
      return errorResponse('请上传数据文件', 400);
    }

    const rawText = await (file as File).text();
    const parsed = EJSON.deserialize(JSON.parse(rawText), { relaxed: false }) as {
      collections?: Record<string, unknown[]>;
    };

    if (!parsed || typeof parsed !== 'object' || !parsed.collections) {
      return errorResponse('数据文件格式不正确', 400);
    }

    const db = await getDb();
    const collections = parsed.collections;
    const canUseTransaction = await supportsTransactions();

    if (canUseTransaction) {
      const session = db.client.startSession();
      try {
        await session.withTransaction(async () => {
          await replaceCollections(db, collections, session);
        });
      } finally {
        await session.endSession();
      }
    } else {
      await replaceCollections(db, collections);
    }

    const importedCounts = Object.fromEntries(
      IMPORT_COLLECTIONS.map((name) => [name, Array.isArray(collections[name]) ? collections[name].length : 0])
    );

    return new Response(
      JSON.stringify({
        message: '数据导入成功！',
        importedCounts,
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch {
    return errorResponse('导入失败', 500);
  }
}
