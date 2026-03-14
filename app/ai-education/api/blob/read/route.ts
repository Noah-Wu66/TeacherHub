import { NextRequest } from 'next/server';
import {
  normalizeBlobPathname,
} from '@/lib/ai-education/blobAssetUtils';
import { head } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const pathParam = req.nextUrl.searchParams.get('path');
    if (!pathParam) {
      return new Response(JSON.stringify({ error: '缺少 path 参数' }), {
        status: 400,
        headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const pathname = normalizeBlobPathname(pathParam);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: '缺少 BLOB_READ_WRITE_TOKEN' }), {
        status: 500,
        headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const meta: any = await head(pathname);
    const blobUrl: string | undefined = typeof meta?.url === 'string' ? meta.url : undefined;
    if (!blobUrl) {
      return new Response(JSON.stringify({ error: 'Blob 不存在' }), {
        status: 404,
        headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Blob 改为 public：这里直接 302 跳转到 blob.url，让客户端/上游AI直取
    return Response.redirect(blobUrl, 302);
  } catch (error) {
    console.error('Blob 读取代理失败:', error);
    return new Response(JSON.stringify({ error: 'Blob 读取失败' }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}


