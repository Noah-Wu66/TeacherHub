export const runtime = 'nodejs';
import { evaluateSessionAction } from '@/app/planting/actions/ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const session = body?.practice_session || { answers: [], total_time: 0 };
    const result = await evaluateSessionAction({ answers: session.answers || [], totalTime: session.total_time || 0 });
    return Response.json(result);
  } catch (e) {
    return new Response(JSON.stringify({ detail: `评估生成错误: ${e?.message || e}` }), { status: 500 });
  }
}


