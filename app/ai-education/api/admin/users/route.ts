import { NextResponse } from "next/server";
import { getDb, supportsTransactions } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS, USER_ROLES, SESSION_FIELDS, CARD_FIELDS, CONVERSATION_FIELDS } from "@/lib/ai-education/models";
import { requireUser } from "@/lib/ai-education/session";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { normalizeClassList, normalizeClassName, uniq } from "@/lib/ai-education/classUtils";

// 生成随机密码（8位，包含大小写字母和数字）
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getTeacherAllowedClasses(user: any): string[] {
  const managed = normalizeClassList(user?.[USER_FIELDS.managedClasses]);
  const own = normalizeClassName(user?.[USER_FIELDS.className]);
  return uniq([...(managed || []), ...(own ? [own] : [])]).filter(Boolean);
}

function buildClassCandidates(allowedClasses: string[]): Array<string | number> {
  const out: Array<string | number> = [];
  const seen = new Set<string>();
  const add = (v: string | number) => {
    const key = `${typeof v}:${String(v)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(v);
  };

  for (const cls of allowedClasses) {
    add(cls);
    const m = cls.match(/^(\d{1,3})班$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    add(String(n));
    add(n);
  }

  return out;
}

// 获取所有用户列表（仅超级管理员）
export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 检查是否为教师或超级管理员
    if (user[USER_FIELDS.role] !== USER_ROLES.superadmin && user[USER_FIELDS.role] !== USER_ROLES.teacher) {
      return NextResponse.json({ message: "权限不足" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const requesterRole = user[USER_FIELDS.role];
    const isSuperadmin = requesterRole === USER_ROLES.superadmin;
    const isTeacher = requesterRole === USER_ROLES.teacher;

    const db = await getDb();
    const users = db.collection(COLLECTIONS.users);

    let query: Record<string, any> = {};
    if (isTeacher && !isSuperadmin) {
      const allowedClasses = getTeacherAllowedClasses(user);
      const candidates = buildClassCandidates(allowedClasses);
      if (candidates.length === 0) {
        return NextResponse.json({ users: [] }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
      }
      query = {
        [USER_FIELDS.role]: USER_ROLES.user,
        [USER_FIELDS.className]: { $in: candidates },
      };
    }

    const allUsers = await users.find(query).sort({ [USER_FIELDS.createdAt]: -1 }).toArray();

    const userList = allUsers.map(u => ({
      id: u._id.toString(),
      name: u[USER_FIELDS.name] || '',
      gender: u[USER_FIELDS.gender] || '',
      grade: u[USER_FIELDS.grade] || '',
      className: normalizeClassName(u[USER_FIELDS.className]),
      role: u[USER_FIELDS.role] || 'user',
      banned: u[USER_FIELDS.banned] || false,
      createdAt: u[USER_FIELDS.createdAt],
    }));

    return NextResponse.json({ users: userList }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

// 管理用户（封禁/删除）
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 检查是否为教师或超级管理员
    if (user[USER_FIELDS.role] !== USER_ROLES.superadmin && user[USER_FIELDS.role] !== USER_ROLES.teacher) {
      return NextResponse.json({ message: "权限不足" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ message: "缺少必要参数" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const db = await getDb();
    const users = db.collection(COLLECTIONS.users);

    let targetUserId: ObjectId;
    try {
      targetUserId = new ObjectId(userId);
    } catch {
      return NextResponse.json({ message: "无效的用户ID" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 不能操作自己
    if (targetUserId.equals(user._id)) {
      return NextResponse.json({ message: "不能操作自己的账户" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const targetUser = await users.findOne({ _id: targetUserId });
    if (!targetUser) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 不能操作其他教师或超级管理员
    if (targetUser[USER_FIELDS.role] === USER_ROLES.superadmin || targetUser[USER_FIELDS.role] === USER_ROLES.teacher) {
      return NextResponse.json({ message: "不能操作其他教师或超级管理员" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const requesterRole = user[USER_FIELDS.role];
    const isSuperadmin = requesterRole === USER_ROLES.superadmin;
    const isTeacher = requesterRole === USER_ROLES.teacher;

    if (isTeacher && !isSuperadmin) {
      const allowed = new Set(getTeacherAllowedClasses(user));
      const targetClass = normalizeClassName(targetUser[USER_FIELDS.className]);
      if (!targetClass || !allowed.has(targetClass)) {
        return NextResponse.json({ message: "权限不足" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
      }
    }

    if (action === 'ban') {
      await users.updateOne(
        { _id: targetUserId },
        { $set: { [USER_FIELDS.banned]: true, [USER_FIELDS.updatedAt]: new Date() } }
      );
      return NextResponse.json({ message: "用户已封禁" }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    } else if (action === 'unban') {
      await users.updateOne(
        { _id: targetUserId },
        { $set: { [USER_FIELDS.banned]: false, [USER_FIELDS.updatedAt]: new Date() } }
      );
      return NextResponse.json({ message: "用户已解封" }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    } else if (action === 'reset-password') {
      // 重置密码
      const newPassword = generateRandomPassword();
      const passwordHash = await bcrypt.hash(newPassword, 10);

      await users.updateOne(
        { _id: targetUserId },
        {
          $set: {
            [USER_FIELDS.passwordHash]: passwordHash,
            [USER_FIELDS.mustChangePassword]: true,
            [USER_FIELDS.updatedAt]: new Date()
          }
        }
      );

      // 清除该用户的所有会话，强制重新登录
      await db.collection(COLLECTIONS.sessions).deleteMany({ [SESSION_FIELDS.userId]: targetUserId });

      return NextResponse.json({
        message: "密码已重置",
        newPassword
      }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    } else if (action === 'delete') {
      // 删除用户及其所有数据
      const canUseTransaction = await supportsTransactions();

      if (canUseTransaction) {
        const session = db.client.startSession();
        try {
          await session.withTransaction(async () => {
            await users.deleteOne({ _id: targetUserId }, { session });
            await db.collection(COLLECTIONS.sessions).deleteMany({ [SESSION_FIELDS.userId]: targetUserId }, { session });
            await db.collection(COLLECTIONS.videoCards).deleteMany({ [CARD_FIELDS.userId]: targetUserId }, { session });
            await db.collection(COLLECTIONS.imageCards).deleteMany({ [CARD_FIELDS.userId]: targetUserId }, { session });
            await db.collection(COLLECTIONS.conversations).deleteMany({ [CONVERSATION_FIELDS.userId]: { $in: [targetUserId, targetUserId.toString()] } }, { session });
          });
        } finally {
          await session.endSession();
        }
      } else {
        await users.deleteOne({ _id: targetUserId });
        await db.collection(COLLECTIONS.sessions).deleteMany({ [SESSION_FIELDS.userId]: targetUserId });
        await db.collection(COLLECTIONS.videoCards).deleteMany({ [CARD_FIELDS.userId]: targetUserId });
        await db.collection(COLLECTIONS.imageCards).deleteMany({ [CARD_FIELDS.userId]: targetUserId });
        await db.collection(COLLECTIONS.conversations).deleteMany({ [CONVERSATION_FIELDS.userId]: { $in: [targetUserId, targetUserId.toString()] } });
      }

      return NextResponse.json({ message: "用户已删除" }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    } else if (action === 'update-class') {
      // 修改班级
      const newClassName = normalizeClassName((body.className || '').trim());
      if (!newClassName) {
        return NextResponse.json({ message: "请选择班级" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
      }

      const requesterRole = user[USER_FIELDS.role];
      const isSuperadmin = requesterRole === USER_ROLES.superadmin;
      const isTeacher = requesterRole === USER_ROLES.teacher;
      if (isTeacher && !isSuperadmin) {
        const allowed = new Set(getTeacherAllowedClasses(user));
        if (!allowed.has(newClassName)) {
          return NextResponse.json({ message: "不能修改到未管理的班级" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
        }
      }

      await users.updateOne(
        { _id: targetUserId },
        { $set: { [USER_FIELDS.className]: newClassName, [USER_FIELDS.updatedAt]: new Date() } }
      );
      return NextResponse.json({ message: "班级已更新" }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    } else {
      return NextResponse.json({ message: "无效的操作" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

