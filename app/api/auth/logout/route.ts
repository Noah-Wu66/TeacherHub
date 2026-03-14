import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroyCurrentSession();
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("[platform/auth/logout] failed:", error);
    return NextResponse.json(
      { message: "退出登录失败" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
