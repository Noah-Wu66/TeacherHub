import { NextResponse } from "next/server";
import {
  buildVoiceQaSessionResponse,
  recordVoiceQaUsage,
  requireVoiceQaUser,
} from "@/lib/teacher-tools/voice-qa/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireVoiceQaUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录正式账号或游客账号后再使用你问我答。" }, { status: 401 });
    }

    await recordVoiceQaUsage(user);
    return NextResponse.json(buildVoiceQaSessionResponse(user), {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("[teacher-tools/voice-qa/session] failed:", error);
    return NextResponse.json(
      { error: "会话初始化失败，请稍后再试。" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
