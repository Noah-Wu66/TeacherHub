export const runtime = 'nodejs';
import { generateQuestionAction } from '@/app/planting/actions/ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const question_number = Number(body?.question_number) || 1;
    const result = await generateQuestionAction({ questionNumber: question_number, difficultyLevel: String(body?.difficulty_level || 'basic') });
    return Response.json({
      question_id: result.question_id,
      question_text: result.question_text,
      parameters: result.parameters,
      expected_answer: result.expected_answer,
      difficulty: result.difficulty
    });
  } catch (e) {
    return new Response(JSON.stringify({ detail: `题目生成错误: ${e?.message || e}` }), { status: 500 });
  }
}


