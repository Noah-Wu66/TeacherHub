import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS } from "@/lib/ai-education/models";
import { assertPassword, requireFormalUser } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireFormalUser();
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "请输入当前密码和新密码" }, { status: 400 });
    }

    assertPassword(newPassword);

    const ok = await bcrypt.compare(currentPassword, String(user?.[USER_FIELDS.passwordHash] || ""));
    if (!ok) {
      return NextResponse.json({ message: "当前密码不正确" }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const users = await getCollection(COLLECTIONS.users);
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          [USER_FIELDS.passwordHash]: passwordHash,
          [USER_FIELDS.mustChangePassword]: false,
          [USER_FIELDS.updatedAt]: new Date(),
        },
      }
    );

    return NextResponse.json(
      { success: true, message: "密码修改成功" },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "密码修改失败";
    return NextResponse.json(
      { message },
      { status: message.includes("至少") ? 400 : 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
