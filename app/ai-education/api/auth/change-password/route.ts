import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS } from "@/lib/ai-education/models";
import { requireUser } from "@/lib/ai-education/session";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "请输入当前密码和新密码" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "新密码至少需要6位" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 验证当前密码
    const ok = await bcrypt.compare(currentPassword, user[USER_FIELDS.passwordHash]);
    if (!ok) {
      return NextResponse.json({ message: "当前密码不正确" }, { status: 401, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const users = await getCollection(COLLECTIONS.users);
    
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          [USER_FIELDS.passwordHash]: newPasswordHash,
          [USER_FIELDS.mustChangePassword]: false,
          [USER_FIELDS.updatedAt]: new Date() 
        } 
      }
    );

    return NextResponse.json({ 
      success: true,
      message: "密码修改成功" 
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}

