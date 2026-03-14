import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS, USER_ROLES } from "@/lib/ai-education/models";
import { getDefaultUserModelPreferences } from "@/lib/ai-education/modelPreferences";
import { normalizeClassList, normalizeClassName } from "@/lib/ai-education/classUtils";

export const dynamic = 'force-dynamic';

// 角色密钥配置
const ROLE_SECRETS = {
  teacher: "teacher",
  superadmin: "superadmin", // 教师密钥填写此值时注册为超级管理员
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body?.name || "").trim();
    const password = body?.password;
    const gender = (body?.gender || "").trim();
    const grade = (body?.grade || "").trim();
    const className = normalizeClassName((body?.className || "").trim());
    let role = body?.role || "user"; // 默认为学生
    const secretKey = body?.secretKey || "";
    // 教师管理班级
    const managedClasses = normalizeClassList(body?.managedClasses);
    // 教师学科
    const subjects = Array.isArray(body?.subjects) ? body.subjects : [];

    if (!name) {
      return NextResponse.json({ message: "请输入姓名" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ message: "密码至少需要6位" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    if (!gender) {
      return NextResponse.json({ message: "请选择性别" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    if (!grade) {
      return NextResponse.json({ message: "请选择年级" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 学生角色必须选择班级
    if (role === USER_ROLES.user && !className) {
      return NextResponse.json({ message: "请选择班级" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 教师角色必须选择管理班级（超级管理员除外）
    if (role === USER_ROLES.teacher && secretKey !== ROLE_SECRETS.superadmin && managedClasses.length === 0) {
      return NextResponse.json({ message: "请至少选择一个管理班级" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 验证角色有效性 - 只允许前端传入 user 或 teacher
    const validRoles = [USER_ROLES.user, USER_ROLES.teacher];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: "无效的身份类型" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 教师密钥验证
    if (role === USER_ROLES.teacher) {
      // 如果密钥是 superadmin，则注册为超级管理员
      if (secretKey === ROLE_SECRETS.superadmin) {
        role = USER_ROLES.superadmin;
      } else if (secretKey !== ROLE_SECRETS.teacher) {
        return NextResponse.json({ message: "教师密钥错误" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
      }
    }

    const users = await getCollection(COLLECTIONS.users);

    // 检查姓名是否已存在
    const existed = await users.findOne({ [USER_FIELDS.name]: name });
    if (existed) {
      return NextResponse.json({ message: "该姓名已被注册" }, { status: 409, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const defaultPreferences = getDefaultUserModelPreferences();

    const insertResult = await users.insertOne({
      [USER_FIELDS.name]: name,
      [USER_FIELDS.passwordHash]: passwordHash,
      [USER_FIELDS.gender]: gender,
      [USER_FIELDS.grade]: grade,
      [USER_FIELDS.className]: className,
      [USER_FIELDS.managedClasses]: managedClasses,
      [USER_FIELDS.subjects]: subjects,
      [USER_FIELDS.role]: role,
      [USER_FIELDS.banned]: false,
      [USER_FIELDS.createdAt]: now,
      [USER_FIELDS.updatedAt]: now,
      [USER_FIELDS.preferences]: {
        model: {
          currentModel: defaultPreferences.currentModel,
          modelParams: defaultPreferences.modelParams,
          updatedAt: defaultPreferences.updatedAt,
        },
      },
    });

    if (!insertResult?.insertedId) {
      return NextResponse.json({ message: "注册失败" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}
