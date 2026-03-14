export const runtime = 'nodejs';
export async function GET() {
  return Response.json({ status: 'healthy', message: '植树问题AI学习平台运行正常' });
}


