import { cookies } from "next/headers";
import { getCollection } from "./mongodb";
import { COLLECTIONS, SESSION_FIELDS } from "./models";

export async function getSessionAndUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    return { session: null, user: null };
  }

  const sessions = await getCollection(COLLECTIONS.sessions);
  const session = await sessions.findOne({ [SESSION_FIELDS.token]: token });

  if (!session) {
    return { session: null, user: null };
  }

  if (session[SESSION_FIELDS.expiresAt] && session[SESSION_FIELDS.expiresAt] < new Date()) {
    await sessions.deleteOne({ _id: session._id });
    try {
      cookieStore.set({ name: "session_token", value: "", httpOnly: true, secure: true, path: "/", maxAge: 0 });
    } catch {
      // 在 Server Components 中可能不允许写入 cookies，这里忽略以保证读取流程可继续。
    }
    return { session: null, user: null };
  }

  const users = await getCollection(COLLECTIONS.users);
  const userId = session[SESSION_FIELDS.userId];
  const user = await users.findOne({ _id: userId });

  if (!user) {
    return { session, user: null };
  }

  return { session, user };
}

export async function requireUser() {
  const { user } = await getSessionAndUser();
  if (!user) {
    return null;
  }
  return user;
}

