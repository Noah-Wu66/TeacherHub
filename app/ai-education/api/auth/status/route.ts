import { getSessionAndUser } from '@/lib/ai-education/session';
import { USER_FIELDS } from '@/lib/ai-education/models';
import { normalizeClassList, normalizeClassName } from '@/lib/ai-education/classUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user } = await getSessionAndUser();

    if (!user) {
      return new Response(
        JSON.stringify({ authenticated: false, user: null }),
        {
          status: 200,
          headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user._id,
          name: user[USER_FIELDS.name],
          gender: user[USER_FIELDS.gender],
          grade: user[USER_FIELDS.grade],
          className: normalizeClassName(user[USER_FIELDS.className]),
          role: user[USER_FIELDS.role] || 'user',
          banned: user[USER_FIELDS.banned] || false,
          mustChangePassword: user[USER_FIELDS.mustChangePassword] || false,
          managedClasses: normalizeClassList(user[USER_FIELDS.managedClasses]),
          subjects: Array.isArray(user[USER_FIELDS.subjects]) ? user[USER_FIELDS.subjects] : [],
        }
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: '获取鉴权状态失败' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      }
    );
  }
}


