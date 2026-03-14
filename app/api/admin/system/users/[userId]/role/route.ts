import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS, USER_ROLES } from "@/lib/ai-education/models";
import { normalizeRole, requireSuperadminUser } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const operator = await requireSuperadminUser();
    if (!operator) {
      return NextResponse.json({ message: "只有超级管理员可以修改角色" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json().catch(() => ({}));
    const targetRole = normalizeRole(body?.role);
    if (targetRole !== USER_ROLES.admin && targetRole !== USER_ROLES.teacher && targetRole !== USER_ROLES.student) {
      return NextResponse.json({ message: "目标角色不合法" }, { status: 400 });
    }

    const users = await getCollection(COLLECTIONS.users);
    const target = await users.findOne({ _id: new ObjectId(userId) });
    if (!target) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }
    if (String(target._id) === String(operator._id)) {
      return NextResponse.json({ message: "不能修改自己的角色" }, { status: 400 });
    }
    if (normalizeRole(target?.[USER_FIELDS.role]) === USER_ROLES.superadmin) {
      return NextResponse.json({ message: "不能修改超级管理员角色" }, { status: 403 });
    }

    await users.updateOne(
      { _id: target._id },
      {
        $set: {
          [USER_FIELDS.role]: targetRole,
          [USER_FIELDS.updatedAt]: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/system/users/:id/role][PATCH] failed:", error);
    return NextResponse.json({ message: "角色修改失败" }, { status: 500 });
  }
}
