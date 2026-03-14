import { NextResponse } from "next/server";
import { requireUser } from "@/lib/ai-education/session";
import { getAllUsageStats } from "@/lib/ai-education/server/usageStats";
import { COLLECTIONS, USAGE_STATS_FIELDS, USER_FIELDS, USER_ROLES } from "@/lib/ai-education/models";
import { getCollection } from "@/lib/ai-education/mongodb";
import { ObjectId } from "mongodb";

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

    if (user[USER_FIELDS.role] !== USER_ROLES.superadmin && user[USER_FIELDS.role] !== USER_ROLES.teacher) {
      return NextResponse.json(
        { message: "权限不足" },
        { status: 403, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const usageList = await getAllUsageStats();
    const userIdSet = new Set<string>();

    for (const item of usageList) {
      const uid = String((item as any)?.[USAGE_STATS_FIELDS.userId] || "");
      if (uid) userIdSet.add(uid);
    }

    const objectIds: ObjectId[] = [];
    for (const id of userIdSet) {
      try {
        objectIds.push(new ObjectId(id));
      } catch {
        // ignore invalid id
      }
    }

    const usersCollection = await getCollection(COLLECTIONS.users);
    const userDocs = objectIds.length
      ? await usersCollection
        .find({ _id: { $in: objectIds } })
        .project({ [USER_FIELDS.name]: 1, [USER_FIELDS.role]: 1 })
        .toArray()
      : [];

    const userInfoMap = new Map<string, { name: string; role: string }>();
    for (const doc of userDocs) {
      const id = doc._id?.toString?.() ?? "";
      if (id) {
        userInfoMap.set(id, {
          name: doc[USER_FIELDS.name],
          role: doc[USER_FIELDS.role] || USER_ROLES.user,
        });
      }
    }

    const resultMap: Record<
      string,
      {
        userId: string;
        name: string;
        role: string;
        usage: Record<string, number>;
        total: number;
      }
    > = {};

    for (const item of usageList) {
      const userId = String((item as any)?.[USAGE_STATS_FIELDS.userId] || "");
      const model = String((item as any)?.[USAGE_STATS_FIELDS.model] || "unknown");
      const count = Number((item as any)?.[USAGE_STATS_FIELDS.count] || 0);

      if (!userId || !model) continue;
      if (!resultMap[userId]) {
        const info = userInfoMap.get(userId);
        resultMap[userId] = {
          userId,
          name: info?.name || "未知用户",
          role: info?.role || USER_ROLES.user,
          usage: {},
          total: 0,
        };
      }
      resultMap[userId].usage[model] = (resultMap[userId].usage[model] || 0) + count;
      resultMap[userId].total += count;
    }

    const users = Object.values(resultMap).sort((a, b) => b.total - a.total);

    return NextResponse.json(
      { users },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch {
    return NextResponse.json(
      { message: "获取统计失败" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}

