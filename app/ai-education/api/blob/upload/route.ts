import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireUser } from '@/lib/ai-education/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        const user = await requireUser();
        if (!user) {
          throw new Error('请先登录');
        }

        const userId = user._id?.toString?.() ?? String(user._id);
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
          ],
          tokenPayload: JSON.stringify({
            userId,
            pathname,
          }),
        };
      },
      onUploadCompleted: async () => {
        // 本项目不在此处落库；对话消息只保存 blob://pathname 引用
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}


