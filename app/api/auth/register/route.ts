import { NextResponse } from "next/server";
import {
  assertPassword,
  createSessionForUser,
  registerFormalUserWithInvitation,
  toPublicUser,
} from "@/lib/platform/auth";
import { USER_ROLES } from "@/lib/ai-education/models";
import { normalizeClassList, normalizeClassName } from "@/lib/ai-education/classUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");
    const gender = String(body?.gender || "").trim();
    const grade = String(body?.grade || "").trim();
    const className = normalizeClassName(String(body?.className || "").trim());
    const role = String(body?.role || USER_ROLES.student).trim() === USER_ROLES.teacher ? USER_ROLES.teacher : USER_ROLES.student;
    const inviteCode = String(body?.inviteCode || "").trim().toUpperCase();
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
    if (!inviteCode) {
      return NextResponse.json({ message: "请输入邀请码" }, { status: 400 });
    }
    if (role === USER_ROLES.student && !className) {
      return NextResponse.json({ message: "请选择班级" }, { status: 400 });
    }
    if (role === USER_ROLES.teacher) {
      if (managedClasses.length === 0) {
        return NextResponse.json({ message: "请至少选择一个管理班级" }, { status: 400 });
      }
      if (subjects.length === 0) {
        return NextResponse.json({ message: "请至少选择一个任教学科" }, { status: 400 });
      }
    }

    const user = await registerFormalUserWithInvitation({
      inviteCode,
      name,
      password,
      gender,
      grade,
      className,
      role,
      managedClasses,
      subjects,
      mustChangePassword: false,
    });
    await createSessionForUser(user._id);

    return NextResponse.json(
      {
        success: true,
        user: toPublicUser(user),
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败";
    const status =
      message.includes("至少") || message.includes("请输入") || message.includes("请选择") ? 400 :
      message.includes("已被注册") ? 409 :
      message.includes("邀请码") ? 403 :
      500;
    return NextResponse.json(
      { message },
      { status, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
