const DEFAULT_MODEL = 'gemini-2.5-flash';

function extractTextFromGenerativeResponse(json) {
  if (!json) return '';
  if (typeof json.text === 'string' && json.text.trim()) return json.text.trim();
  const candidates = json.candidates || [];
  for (const c of candidates) {
    if (c?.content?.parts?.length) {
      const parts = c.content.parts;
      const texts = parts.map(p => p.text).filter(Boolean);
      if (texts.length) return texts.join('\n').trim();
    }
  }
  if (json.outputText) return String(json.outputText).trim();
  return '';
}

export async function generateText({ prompt, model = DEFAULT_MODEL, baseURL, apiKey }) {
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || 'sk-your-api-key-here';
  const resolvedBaseURL = (baseURL || process.env.GEMINI_BASE_URL || 'https://aihubmix.com/gemini').replace(/\/$/, '');

  // Try Google Generative Language v1beta style
  const isGoogle = resolvedBaseURL.includes('generativelanguage.googleapis.com');
  const endpoint = `${resolvedBaseURL}/v1beta/models/${model}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: 'text/plain'
    }
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (isGoogle) {
    // Google endpoint may use key in query; but also accept header in some proxies. We'll prefer query.
  }

  let url = endpoint;
  if (isGoogle) {
    const u = new URL(endpoint);
    u.searchParams.set('key', resolvedApiKey);
    url = u.toString();
  } else {
    headers['x-goog-api-key'] = resolvedApiKey;
    headers['Authorization'] = `Bearer ${resolvedApiKey}`;
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Gemini API HTTP ${resp.status}: ${text || resp.statusText}`);
  }
  const json = await resp.json();
  const out = extractTextFromGenerativeResponse(json);
  return out || '';
}


