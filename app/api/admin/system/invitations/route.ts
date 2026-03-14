import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, INVITATION_FIELDS, USER_ROLES } from "@/lib/ai-education/models";
import { generateInvitationCode, requireAdminUser } from "@/lib/platform/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "权限不足" }, { status: 403 });
    }

    const invitations = await getCollection(COLLECTIONS.invitations);
    const rows = await invitations.find({}).sort({ [INVITATION_FIELDS.createdAt]: -1 }).limit(100).toArray();

    return NextResponse.json({
      invitations: rows.map((item) => ({
        id: String(item._id),
        code: item[INVITATION_FIELDS.code],
        targetRole: item[INVITATION_FIELDS.targetRole],
        status: item[INVITATION_FIELDS.status],
        createdBy: item[INVITATION_FIELDS.createdBy] ? String(item[INVITATION_FIELDS.createdBy]) : "",
        usedBy: item[INVITATION_FIELDS.usedBy] ? String(item[INVITATION_FIELDS.usedBy]) : "",
        usedAt: item[INVITATION_FIELDS.usedAt] || null,
        createdAt: item[INVITATION_FIELDS.createdAt] || null,
      }),
    });
  } catch (error) {
    console.error("[admin/system/invitations][GET] failed:", error);
    return NextResponse.json({ message: "获取邀请码失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "权限不足" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetRole =
      String(body?.targetRole || "").trim() === USER_ROLES.teacher ? USER_ROLES.teacher : USER_ROLES.student;

    const invitations = await getCollection(COLLECTIONS.invitations);
    let code = generateInvitationCode();
    let exists = await invitations.findOne({ [INVITATION_FIELDS.code]: code });
    while (exists) {
      code = generateInvitationCode();
      exists = await invitations.findOne({ [INVITATION_FIELDS.code]: code });
    }

    const now = new Date();
    const result = await invitations.insertOne({
      [INVITATION_FIELDS.code]: code,
      [INVITATION_FIELDS.targetRole]: targetRole,
      [INVITATION_FIELDS.status]: "active",
      [INVITATION_FIELDS.createdBy]: user._id,
      [INVITATION_FIELDS.usedBy]: null,
      [INVITATION_FIELDS.usedAt]: null,
      [INVITATION_FIELDS.createdAt]: now,
      [INVITATION_FIELDS.updatedAt]: now,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: String(result.insertedId),
        code,
        targetRole,
        status: "active",
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("[admin/system/invitations][POST] failed:", error);
    return NextResponse.json({ message: "创建邀请码失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "权限不足" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const invitationId = String(body?.invitationId || "").trim();
    const action = String(body?.action || "").trim();

    if (!invitationId || action !== "revoke") {
      return NextResponse.json({ message: "参数错误" }, { status: 400 });
    }

    const invitations = await getCollection(COLLECTIONS.invitations);
    await invitations.updateOne(
      { _id: new ObjectId(invitationId) },
      {
        $set: {
          [INVITATION_FIELDS.status]: "revoked",
          [INVITATION_FIELDS.updatedAt]: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/system/invitations][PATCH] failed:", error);
    return NextResponse.json({ message: "作废邀请码失败" }, { status: 500 });
  }
}
