export const runtime = 'nodejs';
import { chatAction } from '@/app/planting/actions/ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, interaction_state, chat_history = [], is_new_conversation = false } = body || {};
    const { response, updated_history } = await chatAction({
      message,
      interactionState: interaction_state,
      chatHistory: chat_history,
      isNewConversation: is_new_conversation
    });
    return Response.json({ response, updated_history });
  } catch (e) {
    return new Response(JSON.stringify({ detail: `AI服务错误: ${e?.message || e}` }), { status: 500 });
  }
}


