import { getPlatformSessionAndUser, requireFormalUser } from "@/lib/platform/auth";

export async function getSessionAndUser() {
  const { session, user } = await getPlatformSessionAndUser();
  if (!user || user.accountType === "guest" || user.role === "guest") {
    return { session: null, user: null };
  }
  return { session, user };
}

export async function requireUser() {
  return await requireFormalUser();
}
