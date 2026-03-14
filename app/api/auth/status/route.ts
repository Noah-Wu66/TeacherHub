import { NextResponse } from "next/server";
import { getAccessFlags, getPlatformSessionAndUser, toPublicUser } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getPlatformSessionAndUser();
    const publicUser = user ? toPublicUser(user) : null;

    return NextResponse.json(
      {
        authenticated: Boolean(publicUser),
        user: publicUser,
        access: getAccessFlags(publicUser),
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("[platform/auth/status] failed:", error);
    return NextResponse.json(
      { authenticated: false, user: null, access: getAccessFlags(null), error: "获取鉴权状态失败" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
