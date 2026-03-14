import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS, USER_ROLES, CONVERSATION_FIELDS } from "@/lib/ai-education/models";
import { requireUser } from "@/lib/ai-education/session";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 获取指定学生的对话记录
export async function GET(req: NextRequest) {
    try {
        const user = await requireUser();
        if (!user) {
            return NextResponse.json({ message: "未登录" }, { status: 401, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
        }

        // 检查是否为教师或超级管理员
        if (user[USER_FIELDS.role] !== USER_ROLES.superadmin && user[USER_FIELDS.role] !== USER_ROLES.teacher) {
            return NextResponse.json({ message: "权限不足" }, { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ message: "缺少用户ID" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
        }

        let targetUserId: ObjectId;
        try {
            targetUserId = new ObjectId(userId);
        } catch {
            return NextResponse.json({ message: "无效的用户ID" }, { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
        }

        const db = await getDb();
        const conversations = db.collection(COLLECTIONS.conversations);

        // 获取该用户的所有对话，按时间倒序
        const userConversations = await conversations
            .find({ [CONVERSATION_FIELDS.userId]: { $in: [targetUserId, targetUserId.toString()] } })
            .sort({ [CONVERSATION_FIELDS.updatedAt]: -1 })
            .toArray();

        const conversationList = userConversations.map(c => ({
            id: c._id.toString(),
            title: c[CONVERSATION_FIELDS.title] || '新对话',
            model: c[CONVERSATION_FIELDS.model] || 'unknown',
            messages: c[CONVERSATION_FIELDS.messages] || [],
            totalTokens: c[CONVERSATION_FIELDS.totalTokens] || 0,
            createdAt: c[CONVERSATION_FIELDS.createdAt],
            updatedAt: c[CONVERSATION_FIELDS.updatedAt],
        }));

        return NextResponse.json({ conversations: conversationList }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    } catch {
        return NextResponse.json({ message: "服务器错误" }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }
}
