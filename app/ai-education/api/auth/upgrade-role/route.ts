import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { message: "角色升级接口已停用，请在系统设置中由管理员或超级管理员进行角色管理。" },
    { status: 410, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
