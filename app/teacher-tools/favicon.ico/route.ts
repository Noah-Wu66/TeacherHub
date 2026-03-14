export const dynamic = 'force-static';

export async function GET(request: Request) {
  return Response.redirect(new URL('/teacher-tools/icon', request.url), 308);
}
