import { NextResponse } from "next/server";
import { createGuestUser, createSessionForUser, toPublicUser } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const guest = await createGuestUser();
    await createSessionForUser(guest._id);

    return NextResponse.json(
      {
        success: true,
        user: toPublicUser(guest),
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("[platform/auth/guest-login] failed:", error);
    return NextResponse.json(
      { message: "游客登录失败" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
