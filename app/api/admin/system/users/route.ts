import { NextResponse } from "next/server";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS, USER_ROLES } from "@/lib/ai-education/models";
import {
  assertPassword,
  createFormalUser,
  ensureFormalRoleAllowed,
  requireAdminUser,
  toPublicUser,
} from "@/lib/platform/auth";
import { normalizeClassList, normalizeClassName } from "@/lib/ai-education/classUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "权限不足" }, { status: 403 });
    }

    const users = await getCollection(COLLECTIONS.users);
    const rows = await users
      .find({ [USER_FIELDS.accountType]: { $ne: "guest" } })
      .sort({ [USER_FIELDS.createdAt]: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({
      users: rows.map((item) => toPublicUser(item)),
    });
  } catch (error) {
    console.error("[admin/system/users][GET] failed:", error);
    return NextResponse.json({ message: "获取用户失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const operator = await requireAdminUser();
    if (!operator) {
      return NextResponse.json({ message: "权限不足" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const role = ensureFormalRoleAllowed(String(body?.role || USER_ROLES.student).trim());
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");
    const gender = String(body?.gender || "").trim();
    const grade = String(body?.grade || "").trim();
    const className = normalizeClassName(String(body?.className || "").trim());
    const managedClasses = normalizeClassList(body?.managedClasses);
    const subjects = Array.isArray(body?.subjects) ? body.subjects.filter(Boolean) : [];

    if (!name) {
      return NextResponse.json({ message: "请输入姓名" }, { status: 400 });
    }
    assertPassword(password);
    if (!gender) {
      return NextResponse.json({ message: "请选择性别" }, { status: 400 });
    }
    if (!grade) {
      return NextResponse.json({ message: "请选择年级" }, { status: 400 });
    }
    if (role === USER_ROLES.student && !className) {
      return NextResponse.json({ message: "请选择班级" }, { status: 400 });
    }
    if (role === USER_ROLES.teacher && managedClasses.length === 0) {
      return NextResponse.json({ message: "请至少选择一个管理班级" }, { status: 400 });
    }
    if (role === USER_ROLES.teacher && subjects.length === 0) {
      return NextResponse.json({ message: "请至少选择一个任教学科" }, { status: 400 });
    }
    if (role === USER_ROLES.admin && operator[USER_FIELDS.role] !== USER_ROLES.superadmin) {
      return NextResponse.json({ message: "只有超级管理员可以创建管理员" }, { status: 403 });
    }

    const user = await createFormalUser({
      name,
      password,
      gender,
      grade,
      className,
      role,
      managedClasses,
      subjects,
      mustChangePassword: true,
    });

    return NextResponse.json({
      success: true,
      user: toPublicUser(user),
      initialPassword: password,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建用户失败";
    return NextResponse.json({ message }, { status: message.includes("已被注册") ? 409 : 500 });
  }
}
