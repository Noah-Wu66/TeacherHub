import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, SESSION_FIELDS } from "@/lib/ai-education/models";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
      const sessions = await getCollection(COLLECTIONS.sessions);
      await sessions.deleteOne({ [SESSION_FIELDS.token]: token });
      cookieStore.set({
        name: "session_token",
        value: "",
        httpOnly: true,
        secure: true,
        path: "/",
        maxAge: 0,
      });
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return NextResponse.json({ message: "服务器错误" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}
