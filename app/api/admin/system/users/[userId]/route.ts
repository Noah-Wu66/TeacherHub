import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS, USER_ROLES, USER_STATUSES } from "@/lib/ai-education/models";
import { invalidateUserSessions, normalizeRole, requireAdminUser } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const operator = await requireAdminUser();
    if (!operator) {
      return NextResponse.json({ message: "权限不足" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "").trim();
    const users = await getCollection(COLLECTIONS.users);
    const target = await users.findOne({ _id: new ObjectId(userId) });

    if (!target) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }
    if (String(target._id) === String(operator._id)) {
      return NextResponse.json({ message: "不能操作自己的账户" }, { status: 400 });
    }

    const operatorRole = normalizeRole(operator?.[USER_FIELDS.role]);
    const targetRole = normalizeRole(target?.[USER_FIELDS.role]);
    if (operatorRole !== USER_ROLES.superadmin && (targetRole === USER_ROLES.admin || targetRole === USER_ROLES.superadmin)) {
      return NextResponse.json({ message: "权限不足" }, { status: 403 });
    }
    if (targetRole === USER_ROLES.superadmin) {
      return NextResponse.json({ message: "不能修改超级管理员" }, { status: 403 });
    }

    if (action === "ban" || action === "unban") {
      const banned = action === "ban";
      await users.updateOne(
        { _id: target._id },
        {
          $set: {
            [USER_FIELDS.banned]: banned,
            [USER_FIELDS.status]: banned ? USER_STATUSES.banned : USER_STATUSES.active,
            [USER_FIELDS.updatedAt]: new Date(),
          },
        }
      );
      if (banned) {
        await invalidateUserSessions(target._id);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "reset-password") {
      const newPassword = String(body?.newPassword || "").trim();
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ message: "新密码至少需要6位" }, { status: 400 });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await users.updateOne(
        { _id: target._id },
        {
          $set: {
            [USER_FIELDS.passwordHash]: passwordHash,
            [USER_FIELDS.mustChangePassword]: true,
            [USER_FIELDS.updatedAt]: new Date(),
          },
        }
      );
      await invalidateUserSessions(target._id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "不支持的操作" }, { status: 400 });
  } catch (error) {
    console.error("[admin/system/users/:id][PATCH] failed:", error);
    return NextResponse.json({ message: "更新用户失败" }, { status: 500 });
  }
}
