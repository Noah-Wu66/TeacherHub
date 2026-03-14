import { NextResponse } from "next/server";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS, USER_ROLES, AUTH_CODE_FIELDS } from "@/lib/ai-education/models";
import { requireUser } from "@/lib/ai-education/session";

export const dynamic = 'force-dynamic';

// 预定义的授权码
const AUTH_CODES = {
  admin: "Noah-Admin",
  superadmin: "Noah-Super",
};

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 检查用户是否被封禁
    if (user[USER_FIELDS.banned]) {
      return NextResponse.json({ message: "账户已被封禁" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const body = await request.json();
    const code = (body?.code || "").trim();

    if (!code) {
      return NextResponse.json({ message: "请输入授权码" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    let targetRole = null;

    // 验证授权码
    if (code === AUTH_CODES.admin) {
      targetRole = USER_ROLES.admin;
    } else if (code === AUTH_CODES.superadmin) {
      targetRole = USER_ROLES.superadmin;
    } else {
      return NextResponse.json({ message: "授权码无效" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 如果是超级管理员授权码，需要检查是否已被使用
    if (targetRole === USER_ROLES.superadmin) {
      const authCodes = await getCollection(COLLECTIONS.authCodes);
      const existingCode = await authCodes.findOne({ 
        [AUTH_CODE_FIELDS.code]: AUTH_CODES.superadmin 
      });

    if (existingCode && existingCode[AUTH_CODE_FIELDS.usedBy]) {
      return NextResponse.json({ message: "该超级管理员授权码已被使用" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

      // 记录授权码使用
      if (existingCode) {
        await authCodes.updateOne(
          { [AUTH_CODE_FIELDS.code]: AUTH_CODES.superadmin },
          { 
            $set: { 
              [AUTH_CODE_FIELDS.usedBy]: user._id.toString(),
              [AUTH_CODE_FIELDS.usedAt]: new Date(),
            } 
          }
        );
      } else {
        await authCodes.insertOne({
          [AUTH_CODE_FIELDS.code]: AUTH_CODES.superadmin,
          [AUTH_CODE_FIELDS.type]: 'superadmin',
          [AUTH_CODE_FIELDS.usedBy]: user._id.toString(),
          [AUTH_CODE_FIELDS.usedAt]: new Date(),
        });
      }
    }

    // 更新用户角色
    const users = await getCollection(COLLECTIONS.users);
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          [USER_FIELDS.role]: targetRole,
          [USER_FIELDS.updatedAt]: new Date(),
        } 
      }
    );

    return NextResponse.json({ 
      success: true, 
      role: targetRole,
      message: targetRole === USER_ROLES.superadmin ? "已成为超级管理员" : "已成为管理员",
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

