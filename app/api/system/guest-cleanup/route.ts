import { NextRequest, NextResponse } from "next/server";
import { purgeGuestAccounts } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedCron(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-vercel-cron");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  return cronHeader === "1";
}

async function handleCleanup(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({ message: "未授权" }, { status: 401 });
    }

    const result = await purgeGuestAccounts();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[system/guest-cleanup] failed:", error);
    return NextResponse.json({ message: "清理游客失败" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}
