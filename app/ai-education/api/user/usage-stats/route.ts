import { NextResponse } from "next/server";
import { requireUser } from "@/lib/ai-education/session";
import { getUserUsageStats } from "@/lib/ai-education/server/usageStats";
import { USAGE_STATS_FIELDS } from "@/lib/ai-education/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json(
        { message: "未登录" },
        { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const list = await getUserUsageStats(user._id);
    const stats: Record<string, number> = {};
    let total = 0;

    for (const item of list) {
      const model = String((item as any)?.[USAGE_STATS_FIELDS.model] || "unknown");
      const count = Number((item as any)?.[USAGE_STATS_FIELDS.count] || 0);
      stats[model] = (stats[model] || 0) + count;
      total += count;
    }

    return NextResponse.json(
      { stats, total },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch {
    return NextResponse.json(
      { message: "获取统计失败" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}

