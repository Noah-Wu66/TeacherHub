import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { ObjectId, type ClientSession } from "mongodb";
import bcrypt from "bcryptjs";
import { getCollection, getDb, supportsTransactions } from "@/lib/ai-education/mongodb";
import {
  COLLECTIONS,
  CONVERSATION_FIELDS,
  INVITATION_FIELDS,
  MATH_PROGRESS_FIELDS,
  SESSION_FIELDS,
  TOOL_CHAT_HISTORY_FIELDS,
  USER_ACCOUNT_TYPES,
  USER_FIELDS,
  USER_ROLES,
  USER_STATUSES,
} from "@/lib/ai-education/models";
import { normalizeClassList, normalizeClassName } from "@/lib/ai-education/classUtils";
import { getDefaultUserModelPreferences } from "@/lib/ai-education/modelPreferences";

export type PlatformRole = "student" | "teacher" | "admin" | "superadmin" | "guest";
export type PlatformAccountType = "formal" | "guest";

export type PublicPlatformUser = {
  id: string;
  name: string;
  displayName: string;
  role: PlatformRole;
  accountType: PlatformAccountType;
  gender: string;
  grade: string;
  className: string;
  managedClasses: string[];
  subjects: string[];
  banned: boolean;
  mustChangePassword: boolean;
  guestPurgeAt: string | null;
};

const SESSION_TTL_HOURS = 24 * 7;
const CHINA_TIMEZONE = "Asia/Shanghai";
const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000;

function splitEnvList(raw: string | undefined): string[] {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeRole(input: unknown): PlatformRole {
  const role = String(input || "").trim();
  if (role === USER_ROLES.teacher) return USER_ROLES.teacher;
  if (role === USER_ROLES.admin) return USER_ROLES.admin;
  if (role === USER_ROLES.superadmin) return USER_ROLES.superadmin;
  if (role === USER_ROLES.guest) return USER_ROLES.guest;
  return USER_ROLES.student;
}

export function normalizeAccountType(input: unknown): PlatformAccountType {
  return String(input || "").trim() === USER_ACCOUNT_TYPES.guest
    ? USER_ACCOUNT_TYPES.guest
    : USER_ACCOUNT_TYPES.formal;
}

export function isFormalRole(role: unknown): boolean {
  return normalizeRole(role) !== USER_ROLES.guest;
}

export function isFormalAccount(user: any): boolean {
  return normalizeAccountType(user?.[USER_FIELDS.accountType] ?? user?.accountType) === USER_ACCOUNT_TYPES.formal;
}

export function isGuestAccount(user: any): boolean {
  return normalizeAccountType(user?.[USER_FIELDS.accountType] ?? user?.accountType) === USER_ACCOUNT_TYPES.guest;
}

export function isBannedUser(user: any): boolean {
  const status = String(user?.[USER_FIELDS.status] ?? user?.status ?? "").trim();
  return Boolean(user?.[USER_FIELDS.banned] ?? user?.banned) || status === USER_STATUSES.banned;
}

export function getDisplayName(user: any): string {
  const accountType = normalizeAccountType(user?.[USER_FIELDS.accountType] ?? user?.accountType);
  const name = String(user?.[USER_FIELDS.name] ?? user?.name ?? "").trim();
  if (accountType === USER_ACCOUNT_TYPES.guest) {
    const suffix = name.split("-").pop() || name;
    return `游客${suffix.slice(-4)}`;
  }
  return name || "未命名用户";
}

export function getConfiguredSuperadminNames(): string[] {
  return splitEnvList(process.env.PLATFORM_SUPERADMIN_NAMES);
}

export async function promoteConfiguredSuperadmin(user: any) {
  if (!user?._id) return user;
  const role = normalizeRole(user[USER_FIELDS.role]);
  const accountType = normalizeAccountType(user[USER_FIELDS.accountType]);
  const status = isBannedUser(user) ? USER_STATUSES.banned : USER_STATUSES.active;

  const needsNormalization =
    role !== String(user[USER_FIELDS.role] || "") ||
    accountType !== String(user[USER_FIELDS.accountType] || "") ||
    status !== String(user[USER_FIELDS.status] || "");

  if (needsNormalization) {
    const users = await getCollection(COLLECTIONS.users);
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          [USER_FIELDS.role]: role,
          [USER_FIELDS.accountType]: accountType,
          [USER_FIELDS.status]: status,
          [USER_FIELDS.banned]: status === USER_STATUSES.banned,
          [USER_FIELDS.updatedAt]: new Date(),
        },
      }
    );
    user = {
      ...user,
      [USER_FIELDS.role]: role,
      [USER_FIELDS.accountType]: accountType,
      [USER_FIELDS.status]: status,
      [USER_FIELDS.banned]: status === USER_STATUSES.banned,
    };
  }

  if (accountType !== USER_ACCOUNT_TYPES.formal) {
    return user;
  }

  const userName = String(user[USER_FIELDS.name] || "").trim();
  if (!userName) return user;

  const configuredNames = getConfiguredSuperadminNames();
  if (!configuredNames.includes(userName)) {
    return user;
  }

  if (normalizeRole(user[USER_FIELDS.role]) === USER_ROLES.superadmin) {
    return user;
  }

  const users = await getCollection(COLLECTIONS.users);
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        [USER_FIELDS.role]: USER_ROLES.superadmin,
        [USER_FIELDS.accountType]: USER_ACCOUNT_TYPES.formal,
        [USER_FIELDS.status]: USER_STATUSES.active,
        [USER_FIELDS.banned]: false,
        [USER_FIELDS.updatedAt]: new Date(),
      },
    }
  );

  return {
    ...user,
    [USER_FIELDS.role]: USER_ROLES.superadmin,
    [USER_FIELDS.accountType]: USER_ACCOUNT_TYPES.formal,
    [USER_FIELDS.status]: USER_STATUSES.active,
    [USER_FIELDS.banned]: false,
  };
}

export function toPublicUser(user: any): PublicPlatformUser {
  return {
    id: String(user?._id || user?.id || ""),
    name: String(user?.[USER_FIELDS.name] ?? user?.name ?? ""),
    displayName: getDisplayName(user),
    role: normalizeRole(user?.[USER_FIELDS.role] ?? user?.role),
    accountType: normalizeAccountType(user?.[USER_FIELDS.accountType] ?? user?.accountType),
    gender: String(user?.[USER_FIELDS.gender] ?? user?.gender ?? ""),
    grade: String(user?.[USER_FIELDS.grade] ?? user?.grade ?? ""),
    className: normalizeClassName(user?.[USER_FIELDS.className] ?? user?.className),
    managedClasses: normalizeClassList(user?.[USER_FIELDS.managedClasses] ?? user?.managedClasses),
    subjects: Array.isArray(user?.[USER_FIELDS.subjects] ?? user?.subjects)
      ? [...(user?.[USER_FIELDS.subjects] ?? user?.subjects)]
      : [],
    banned: isBannedUser(user),
    mustChangePassword: Boolean(user?.[USER_FIELDS.mustChangePassword] ?? user?.mustChangePassword),
    guestPurgeAt: user?.[USER_FIELDS.guestPurgeAt]
      ? new Date(user[USER_FIELDS.guestPurgeAt]).toISOString()
      : null,
  };
}

export function getAccessFlags(user: PublicPlatformUser | null) {
  const isAuthenticated = Boolean(user);
  const isFormal = Boolean(user && user.accountType === USER_ACCOUNT_TYPES.formal);

  return {
    authenticated: isAuthenticated,
    home: isFormal,
    aiEducation: isFormal,
    admin: Boolean(
      user &&
      user.accountType === USER_ACCOUNT_TYPES.formal &&
      (user.role === USER_ROLES.admin || user.role === USER_ROLES.superadmin)
    ),
    guestAllowedTools: ["/24-point", "/sudoku", "/math", "/tugui", "/planting", "/teacher-tools"],
  };
}

function createSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
}

async function setSessionCookie(token: string) {
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
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "session_token",
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function createSessionForUser(userId: ObjectId) {
  const sessions = await getCollection(COLLECTIONS.sessions);
  const token = randomBytes(32).toString("hex");
  await sessions.insertOne({
    [SESSION_FIELDS.userId]: userId,
    [SESSION_FIELDS.token]: token,
    [SESSION_FIELDS.createdAt]: new Date(),
    [SESSION_FIELDS.expiresAt]: createSessionExpiry(),
  });
  await setSessionCookie(token);
  return token;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (token) {
    const sessions = await getCollection(COLLECTIONS.sessions);
    await sessions.deleteOne({ [SESSION_FIELDS.token]: token });
  }
  await clearSessionCookie();
}

export async function invalidateUserSessions(userId: ObjectId) {
  const sessions = await getCollection(COLLECTIONS.sessions);
  await sessions.deleteMany({ [SESSION_FIELDS.userId]: userId });
}

export async function getPlatformSessionAndUser() {
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
    await clearSessionCookie();
    return { session: null, user: null };
  }

  const users = await getCollection(COLLECTIONS.users);
  const user = await users.findOne({ _id: session[SESSION_FIELDS.userId] });
  if (!user) {
    return { session, user: null };
  }

  if (
    normalizeAccountType(user[USER_FIELDS.accountType]) === USER_ACCOUNT_TYPES.guest &&
    user[USER_FIELDS.guestPurgeAt] &&
    new Date(user[USER_FIELDS.guestPurgeAt]) <= new Date()
  ) {
    await users.deleteOne({ _id: user._id });
    await sessions.deleteMany({ [SESSION_FIELDS.userId]: user._id });
    await clearSessionCookie();
    return { session: null, user: null };
  }

  const normalizedUser = await promoteConfiguredSuperadmin(user);
  if (isBannedUser(normalizedUser)) {
    await sessions.deleteOne({ _id: session._id });
    await clearSessionCookie();
    return { session: null, user: null };
  }

  return { session, user: normalizedUser };
}

export async function requireAnyUser() {
  const { user } = await getPlatformSessionAndUser();
  return user;
}

export async function requireFormalUser() {
  const user = await requireAnyUser();
  if (!user || !isFormalAccount(user)) {
    return null;
  }
  return user;
}

export async function requireAdminUser() {
  const user = await requireFormalUser();
  const role = normalizeRole(user?.[USER_FIELDS.role]);
  if (!user || (role !== USER_ROLES.admin && role !== USER_ROLES.superadmin)) {
    return null;
  }
  return user;
}

export async function requireSuperadminUser() {
  const user = await requireFormalUser();
  if (!user || normalizeRole(user?.[USER_FIELDS.role]) !== USER_ROLES.superadmin) {
    return null;
  }
  return user;
}

export function getChinaNow() {
  return new Date(Date.now() + CHINA_OFFSET_MS);
}

export function getNextChinaMidnightUtcDate(now = new Date()) {
  const chinaNow = new Date(now.getTime() + CHINA_OFFSET_MS);
  const year = chinaNow.getUTCFullYear();
  const month = chinaNow.getUTCMonth();
  const day = chinaNow.getUTCDate();
  const nextChinaMidnightMs = Date.UTC(year, month, day + 1, 0, 0, 0) - CHINA_OFFSET_MS;
  return new Date(nextChinaMidnightMs);
}

function buildGuestName() {
  const chinaNow = getChinaNow();
  const datePart = [
    chinaNow.getUTCFullYear(),
    String(chinaNow.getUTCMonth() + 1).padStart(2, "0"),
    String(chinaNow.getUTCDate()).padStart(2, "0"),
  ].join("");
  const randomPart = randomBytes(3).toString("hex").slice(0, 6);
  return `guest-${datePart}-${randomPart}`;
}

export async function createGuestUser() {
  const users = await getCollection(COLLECTIONS.users);
  const now = new Date();
  const guestPurgeAt = getNextChinaMidnightUtcDate(now);
  const passwordHash = await bcrypt.hash(randomBytes(16).toString("hex"), 10);

  const guestUser = {
    [USER_FIELDS.name]: buildGuestName(),
    [USER_FIELDS.passwordHash]: passwordHash,
    [USER_FIELDS.accountType]: USER_ACCOUNT_TYPES.guest,
    [USER_FIELDS.status]: USER_STATUSES.active,
    [USER_FIELDS.gender]: "",
    [USER_FIELDS.grade]: "",
    [USER_FIELDS.className]: "",
    [USER_FIELDS.managedClasses]: [],
    [USER_FIELDS.subjects]: [],
    [USER_FIELDS.role]: USER_ROLES.guest,
    [USER_FIELDS.banned]: false,
    [USER_FIELDS.mustChangePassword]: false,
    [USER_FIELDS.guestPurgeAt]: guestPurgeAt,
    [USER_FIELDS.createdAt]: now,
    [USER_FIELDS.updatedAt]: now,
  };

  const result = await users.insertOne(guestUser);
  return {
    _id: result.insertedId,
    ...guestUser,
  };
}

type CreateFormalUserParams = {
  name: string;
  password: string;
  gender: string;
  grade: string;
  className?: string;
  role: "student" | "teacher" | "admin";
  managedClasses?: string[];
  subjects?: string[];
  mustChangePassword?: boolean;
};

type InvitationRegistrationRole = "student" | "teacher";

type RegisterFormalUserWithInvitationParams = Omit<CreateFormalUserParams, "role"> & {
  role: InvitationRegistrationRole;
  inviteCode: string;
};

function getInvitationRoleMismatchMessage(expectedRole: InvitationRegistrationRole) {
  return expectedRole === USER_ROLES.teacher ? "教师注册需要教师邀请码" : "学生注册需要学生邀请码";
}

async function claimInvitationForRegistration(
  code: string,
  expectedRole: InvitationRegistrationRole,
  session?: ClientSession
) {
  const db = await getDb();
  const invitations = db.collection(COLLECTIONS.invitations);
  const now = new Date();
  const filter = {
    [INVITATION_FIELDS.code]: code,
    [INVITATION_FIELDS.status]: "active",
    [INVITATION_FIELDS.targetRole]: expectedRole,
  };
  const updateOptions = session ? { session } : undefined;

  const result = await invitations.updateOne(
    filter,
    {
      $set: {
        [INVITATION_FIELDS.status]: "pending",
        [INVITATION_FIELDS.updatedAt]: now,
      },
    },
    updateOptions
  );

  if (result.modifiedCount === 1) {
    const claimedInvitation = await invitations.findOne(
      {
        [INVITATION_FIELDS.code]: code,
        [INVITATION_FIELDS.status]: "pending",
      },
      updateOptions
    );
    if (claimedInvitation) {
      return claimedInvitation;
    }
  }

  const invitation = await invitations.findOne({ [INVITATION_FIELDS.code]: code }, updateOptions);
  if (!invitation) {
    throw new Error("邀请码不存在");
  }
  if (String(invitation?.[INVITATION_FIELDS.targetRole] || "") !== expectedRole) {
    throw new Error(getInvitationRoleMismatchMessage(expectedRole));
  }
  throw new Error("邀请码不可用");
}

async function finalizeClaimedInvitation(
  invitationId: ObjectId,
  userId: ObjectId,
  session?: ClientSession
) {
  const db = await getDb();
  const invitations = db.collection(COLLECTIONS.invitations);
  const updateOptions = session ? { session } : undefined;
  const result = await invitations.updateOne(
    {
      _id: invitationId,
      [INVITATION_FIELDS.status]: "pending",
    },
    {
      $set: {
        [INVITATION_FIELDS.status]: "used",
        [INVITATION_FIELDS.usedBy]: userId,
        [INVITATION_FIELDS.usedAt]: new Date(),
        [INVITATION_FIELDS.updatedAt]: new Date(),
      },
    },
    updateOptions
  );

  if (result.modifiedCount !== 1) {
    throw new Error("邀请码不可用");
  }
}

async function releaseClaimedInvitation(invitationId: ObjectId) {
  const invitations = await getCollection(COLLECTIONS.invitations);
  await invitations.updateOne(
    {
      _id: invitationId,
      [INVITATION_FIELDS.status]: "pending",
    },
    {
      $set: {
        [INVITATION_FIELDS.status]: "active",
        [INVITATION_FIELDS.usedBy]: null,
        [INVITATION_FIELDS.usedAt]: null,
        [INVITATION_FIELDS.updatedAt]: new Date(),
      },
    }
  );
}

export async function createFormalUser(
  params: CreateFormalUserParams,
  options?: { session?: ClientSession }
) {
  const db = await getDb();
  const users = db.collection(COLLECTIONS.users);
  const queryOptions = options?.session ? { session: options.session } : undefined;
  const existed = await users.findOne({ [USER_FIELDS.name]: params.name }, queryOptions);
  if (existed) {
    throw new Error("该姓名已被注册");
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(params.password, 10);
  const defaultPreferences = getDefaultUserModelPreferences();

  const role = params.role === USER_ROLES.admin ? USER_ROLES.admin : params.role === USER_ROLES.teacher ? USER_ROLES.teacher : USER_ROLES.student;

  const doc = {
    [USER_FIELDS.name]: params.name,
    [USER_FIELDS.passwordHash]: passwordHash,
    [USER_FIELDS.accountType]: USER_ACCOUNT_TYPES.formal,
    [USER_FIELDS.status]: USER_STATUSES.active,
    [USER_FIELDS.gender]: params.gender,
    [USER_FIELDS.grade]: params.grade,
    [USER_FIELDS.className]: normalizeClassName(params.className || ""),
    [USER_FIELDS.managedClasses]: normalizeClassList(params.managedClasses),
    [USER_FIELDS.subjects]: Array.isArray(params.subjects) ? params.subjects.filter(Boolean) : [],
    [USER_FIELDS.role]: role,
    [USER_FIELDS.banned]: false,
    [USER_FIELDS.mustChangePassword]: Boolean(params.mustChangePassword),
    [USER_FIELDS.createdAt]: now,
    [USER_FIELDS.updatedAt]: now,
    [USER_FIELDS.preferences]: {
      model: {
        currentModel: defaultPreferences.currentModel,
        modelParams: defaultPreferences.modelParams,
        updatedAt: defaultPreferences.updatedAt,
      },
    },
  };

  const result = await users.insertOne(doc, queryOptions);
  const inserted = { _id: result.insertedId, ...doc };
  if (options?.session) {
    return inserted;
  }
  return await promoteConfiguredSuperadmin(inserted);
}

export async function verifyFormalLogin(name: string, password: string) {
  const users = await getCollection(COLLECTIONS.users);
  const user = await users.findOne({ [USER_FIELDS.name]: name });
  if (!user) {
    throw new Error("姓名或密码不正确");
  }

  if (isBannedUser(user)) {
    throw new Error("账户已被封禁，无法登录");
  }

  const ok = await bcrypt.compare(password, String(user?.[USER_FIELDS.passwordHash] || ""));
  if (!ok) {
    throw new Error("姓名或密码不正确");
  }

  return await promoteConfiguredSuperadmin(user);
}

export function assertPassword(password: string) {
  if (!password || password.length < 6) {
    throw new Error("密码至少需要6位");
  }
}

export async function assertUsableInvitation(code: string, expectedRole: InvitationRegistrationRole) {
  const invitations = await getCollection(COLLECTIONS.invitations);
  const invitation = await invitations.findOne({ [INVITATION_FIELDS.code]: code });
  if (!invitation) {
    throw new Error("邀请码不存在");
  }
  if (String(invitation?.[INVITATION_FIELDS.status] || "") !== "active") {
    throw new Error("邀请码不可用");
  }
  if (String(invitation?.[INVITATION_FIELDS.targetRole] || "") !== expectedRole) {
    throw new Error(expectedRole === USER_ROLES.teacher ? "教师注册需要教师邀请码" : "学生注册需要学生邀请码");
  }
  return invitation;
}

export async function markInvitationUsed(invitationId: ObjectId, userId: ObjectId) {
  const invitations = await getCollection(COLLECTIONS.invitations);
  await invitations.updateOne(
    { _id: invitationId },
    {
      $set: {
        [INVITATION_FIELDS.status]: "used",
        [INVITATION_FIELDS.usedBy]: userId,
        [INVITATION_FIELDS.usedAt]: new Date(),
        [INVITATION_FIELDS.updatedAt]: new Date(),
      },
    }
  );
}

export async function registerFormalUserWithInvitation(
  params: RegisterFormalUserWithInvitationParams
) {
  const createUserParams: CreateFormalUserParams = {
    name: params.name,
    password: params.password,
    gender: params.gender,
    grade: params.grade,
    className: params.className,
    role: params.role,
    managedClasses: params.managedClasses,
    subjects: params.subjects,
    mustChangePassword: params.mustChangePassword,
  };

  if (await supportsTransactions()) {
    const db = await getDb();
    const session = db.client.startSession();
    let createdUser: Awaited<ReturnType<typeof createFormalUser>> | null = null;

    try {
      await session.withTransaction(async () => {
        const invitation = await claimInvitationForRegistration(params.inviteCode, params.role, session);
        createdUser = await createFormalUser(createUserParams, { session });
        await finalizeClaimedInvitation(invitation._id, createdUser._id, session);
      });
    } finally {
      await session.endSession();
    }

    if (!createdUser) {
      throw new Error("注册失败");
    }

    return await promoteConfiguredSuperadmin(createdUser);
  }

  const invitation = await claimInvitationForRegistration(params.inviteCode, params.role);

  try {
    const createdUser = await createFormalUser(createUserParams);
    await finalizeClaimedInvitation(invitation._id, createdUser._id);
    return createdUser;
  } catch (error) {
    await releaseClaimedInvitation(invitation._id);
    throw error;
  }
}

export function generateInvitationCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function purgeGuestAccounts() {
  const db = await getDb();
  const users = db.collection(COLLECTIONS.users);
  const sessions = db.collection(COLLECTIONS.sessions);
  const conversations = db.collection(COLLECTIONS.conversations);
  const usageStats = db.collection(COLLECTIONS.usageStats);
  const mathProgress = db.collection(COLLECTIONS.mathProgress);
  const toolChatHistories = db.collection(COLLECTIONS.toolChatHistories);

  const expiredGuests = await users
    .find({
      [USER_FIELDS.accountType]: USER_ACCOUNT_TYPES.guest,
      [USER_FIELDS.guestPurgeAt]: { $lte: new Date() },
    })
    .project({ _id: 1 })
    .toArray();

  if (expiredGuests.length === 0) {
    return { deletedUsers: 0 };
  }

  const userIds = expiredGuests.map((item) => item._id);

  const runCleanup = async (session?: any) => {
    await users.deleteMany({ _id: { $in: userIds } }, session ? { session } : undefined);
    await sessions.deleteMany({ [SESSION_FIELDS.userId]: { $in: userIds } }, session ? { session } : undefined);
    await conversations.deleteMany(
      { [CONVERSATION_FIELDS.userId]: { $in: [...userIds, ...userIds.map((item) => item.toString())] } },
      session ? { session } : undefined
    );
    await usageStats.deleteMany({ userId: { $in: userIds } }, session ? { session } : undefined);
    await mathProgress.deleteMany({ [MATH_PROGRESS_FIELDS.userId]: { $in: userIds } }, session ? { session } : undefined);
    await toolChatHistories.deleteMany(
      { [TOOL_CHAT_HISTORY_FIELDS.userId]: { $in: [...userIds, ...userIds.map((item) => item.toString())] } },
      session ? { session } : undefined
    );
  };

  if (await supportsTransactions()) {
    const mongoSession = db.client.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        await runCleanup(mongoSession);
      });
    } finally {
      await mongoSession.endSession();
    }
  } else {
    await runCleanup();
  }

  return { deletedUsers: userIds.length };
}

export function ensureFormalRoleAllowed(role: string): "student" | "teacher" | "admin" {
  if (role === USER_ROLES.teacher) return USER_ROLES.teacher;
  if (role === USER_ROLES.admin) return USER_ROLES.admin;
  return USER_ROLES.student;
}

export function getTodayChinaDateLabel(now = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: CHINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
