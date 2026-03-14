import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/ai-education/session';
import { getCollection } from '@/lib/ai-education/mongodb';
import { COLLECTIONS, USER_FIELDS } from '@/lib/ai-education/models';
import {
  mergeUserModelPreferences,
  normalizeUserModelPreferences,
} from '@/lib/ai-education/modelPreferences';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JSON_HEADERS = {
  'content-type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const rawPrefs = user?.[USER_FIELDS.preferences]?.model;
    const prefs = normalizeUserModelPreferences(rawPrefs);

    return new Response(JSON.stringify(prefs), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch {
    return new Response(JSON.stringify({ error: '获取模型偏好失败' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const body = await req.json();
    const incomingModel =
      typeof body?.currentModel === 'string' ? body.currentModel : undefined;
    const incomingParams =
      body?.modelParams && typeof body.modelParams === 'object'
        ? body.modelParams
        : undefined;

    const existing = normalizeUserModelPreferences(user?.[USER_FIELDS.preferences]?.model);
    const merged = mergeUserModelPreferences(existing, {
      currentModel: incomingModel,
      modelParams: incomingParams,
    });

    const users = await getCollection(COLLECTIONS.users);
    const now = new Date();

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          [USER_FIELDS.preferences]: {
            model: {
              currentModel: merged.currentModel,
              modelParams: merged.modelParams,
              updatedAt: now,
            },
          },
          [USER_FIELDS.updatedAt]: now,
        },
      }
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch {
    return new Response(JSON.stringify({ error: '更新模型偏好失败' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

