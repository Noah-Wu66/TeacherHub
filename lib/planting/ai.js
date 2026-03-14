const DEFAULT_MODEL = 'deepseek-chat';

function extractTextFromChatResponse(json) {
  if (!json) return '';
  const content = json?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content.trim() : '';
}

export async function generateText({ prompt, model = DEFAULT_MODEL, baseURL, apiKey }) {
  const resolvedApiKey = apiKey || process.env.DEEPSEEK_API_KEY || 'sk-your-api-key-here';
  const resolvedBaseURL = (baseURL || 'https://api.deepseek.com').replace(/\/$/, '');
  const endpoint = `${resolvedBaseURL}/chat/completions`;

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 4096
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${resolvedApiKey}`,
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`DeepSeek API HTTP ${resp.status}: ${text || resp.statusText}`);
  }
  const json = await resp.json();
  const out = extractTextFromChatResponse(json);
  return out || '';
}

