import { NextResponse } from "next/server";
import { buildToolDirectory } from "@/lib/platform/tool-directory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body?.password || "").trim();
    const expectedPassword = String(process.env.TOOL_QUERY_PASSWORD || "").trim();

    if (!expectedPassword) {
      return NextResponse.json(
        { message: "服务器还没有设置工具查询密码" },
        { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { message: "请输入 4 位数字密码" },
        { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    if (password !== expectedPassword) {
      return NextResponse.json(
        { message: "密码不正确" },
        { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const origin = new URL(request.url).origin;
    const groups = buildToolDirectory(origin);
    const total = groups.reduce((sum, group) => sum + group.items.length, 0);

    return NextResponse.json(
      { success: true, total, groups },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("[tool-directory] failed:", error);
    return NextResponse.json(
      { message: "查询失败" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
