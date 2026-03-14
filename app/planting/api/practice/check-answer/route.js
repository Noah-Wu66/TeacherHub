export const runtime = 'nodejs';
import { checkAnswerAction } from '@/app/planting/actions/ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await checkAnswerAction({ parameters: body?.parameters || {}, userAnswer: body?.user_answer });
    return Response.json(result);
  } catch (e) {
    return new Response(JSON.stringify({ detail: `答案检查错误: ${e?.message || e}` }), { status: 500 });
  }
}


