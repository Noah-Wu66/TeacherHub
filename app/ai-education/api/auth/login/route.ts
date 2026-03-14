import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, SESSION_FIELDS, USER_FIELDS } from "@/lib/ai-education/models";
import { normalizeClassList, normalizeClassName } from "@/lib/ai-education/classUtils";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

const SESSION_TTL_HOURS = 168;

function getPublicErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("MONGO_URI")) {
      return error.message;
    }
    const name = (error as any)?.name;
    const msg = error.message || "";
    if (
      name === "MongoServerSelectionError" ||
      /MongoServerSelectionError|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(msg)
    ) {
      return "数据库连接失败，请检查环境变量 MONGO_URI 是否正确，并确保数据库可访问。";
    }
  }
  return "服务器错误";
}

export async function POST(request: Request) {
  try {
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "请求体格式错误" },
        { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }
    const name = (body?.name || "").trim();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!name || !password) {
      return NextResponse.json({ message: "姓名或密码不正确" }, { status: 400 });
    }

    const users = await getCollection(COLLECTIONS.users);
    const user = await users.findOne({ [USER_FIELDS.name]: name });

    if (!user) {
      return NextResponse.json({ message: "姓名或密码不正确" }, { status: 401 });
    }

    const passwordHash = user?.[USER_FIELDS.passwordHash];
    if (typeof passwordHash !== "string" || !passwordHash) {
      console.warn("[auth/login] user missing passwordHash:", {
        userId: String(user?._id),
        name,
      });
      return NextResponse.json({ message: "姓名或密码不正确" }, { status: 401 });
    }

    let ok = false;
    try {
      ok = await bcrypt.compare(password, passwordHash);
    } catch (error) {
      console.error("[auth/login] bcrypt.compare failed:", {
        userId: String(user?._id),
        name,
        error,
      });
      return NextResponse.json(
        { message: "账户数据异常，无法登录" },
        { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }
    if (!ok) {
      return NextResponse.json({ message: "姓名或密码不正确" }, { status: 401 });
    }

    // 检查用户是否被封禁
    if (user[USER_FIELDS.banned]) {
      return NextResponse.json({ message: "账户已被封禁，无法登录" }, { status: 403 });
    }

    const sessions = await getCollection(COLLECTIONS.sessions);
    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const expires = new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    await sessions.insertOne({
      [SESSION_FIELDS.userId]: user._id,
      [SESSION_FIELDS.token]: token,
      [SESSION_FIELDS.createdAt]: now,
      [SESSION_FIELDS.expiresAt]: expires,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "session_token",
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_HOURS * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user[USER_FIELDS.name],
        gender: user[USER_FIELDS.gender],
        grade: user[USER_FIELDS.grade],
        className: normalizeClassName(user[USER_FIELDS.className]),
        role: user[USER_FIELDS.role] || 'user',
        banned: user[USER_FIELDS.banned] || false,
        mustChangePassword: user[USER_FIELDS.mustChangePassword] || false,
        managedClasses: normalizeClassList(user[USER_FIELDS.managedClasses]),
      }
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    console.error("[auth/login] unexpected error:", error);
    return NextResponse.json(
      { message: getPublicErrorMessage(error) },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
