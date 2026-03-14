import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_EDUCATION_PUBLIC_PATHS = [
  '/ai-education/api/auth/login',
  '/ai-education/api/auth/register',
  '/ai-education/api/auth/logout',
  '/ai-education/api/auth/status',
  '/ai-education/api/auth/upgrade-role',
];

const AI_EDUCATION_PROTECTED_PREFIXES = [
  '/ai-education/api/deepseek-reasoner',
  '/ai-education/api/conversations',
  '/ai-education/api/admin',
  '/ai-education/api/dasi-zhengke',
  '/ai-education/api/voice-chat',
  '/ai-education/api/asr',
  '/ai-education/api/tts',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 只处理 AI-Education 的 API 路由
  if (!pathname.startsWith('/ai-education/api/')) {
    return NextResponse.next();
  }

  // 放行公开路径
  if (AI_EDUCATION_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 检查需要保护的 API 路由
  const isProtectedApi = AI_EDUCATION_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtectedApi) {
    const sessionToken = req.cookies.get('session_token');
    if (!sessionToken) {
      return new NextResponse(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ai-education/api/:path*'],
};
