function normalizeAIEducationInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== 'string') {
    return input;
  }

  if (input.startsWith('/api/')) {
    return `/ai-education${input}`;
  }

  return input;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...(init.headers as Record<string, string> | undefined),
  };
  const req: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  };
  const res = await fetch(normalizeAIEducationInput(input), req);
  return res;
}
