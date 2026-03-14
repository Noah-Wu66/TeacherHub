import { NextResponse } from "next/server";
import { createSessionForUser, toPublicUser, verifyFormalLogin } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");

    if (!name || !password) {
      return NextResponse.json({ message: "请输入姓名和密码" }, { status: 400 });
    }

    const user = await verifyFormalLogin(name, password);
    await createSessionForUser(user._id);

    return NextResponse.json(
      {
        success: true,
        user: toPublicUser(user),
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    const status = message.includes("封禁") ? 403 : message.includes("不正确") ? 401 : 500;
    return NextResponse.json(
      { message },
      { status, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
