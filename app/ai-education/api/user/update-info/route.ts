import { NextResponse } from "next/server";
import { getSessionAndUser } from "@/lib/ai-education/session";
import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USER_FIELDS } from "@/lib/ai-education/models";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // 验证用户登录状态
        const { user } = await getSessionAndUser();
        if (!user) {
            return NextResponse.json({ message: "未登录" }, { status: 401 });
        }

        // 只允许教师修改自己的信息
        if (user[USER_FIELDS.role] !== 'teacher') {
            return NextResponse.json({ message: "只有教师可以修改个人信息" }, { status: 403 });
        }

        const body = await request.json();
        const name = (body?.name || "").trim();
        const gender = (body?.gender || "").trim();
        const grade = (body?.grade || "").trim();
        const className = (body?.className || "").trim();
        const subjects = Array.isArray(body?.subjects) ? body.subjects : [];

        if (!name) {
            return NextResponse.json({ message: "请输入姓名" }, { status: 400 });
        }

        if (!gender) {
            return NextResponse.json({ message: "请选择性别" }, { status: 400 });
        }

        if (!grade) {
            return NextResponse.json({ message: "请选择年级" }, { status: 400 });
        }

        if (!className) {
            return NextResponse.json({ message: "请选择班级" }, { status: 400 });
        }

        // 更新用户信息
        const users = await getCollection(COLLECTIONS.users);
        const updateResult = await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    [USER_FIELDS.name]: name,
                    [USER_FIELDS.gender]: gender,
                    [USER_FIELDS.grade]: grade,
                    [USER_FIELDS.className]: className,
                    [USER_FIELDS.subjects]: subjects,
                    [USER_FIELDS.updatedAt]: new Date(),
                },
            }
        );

        if (updateResult.modifiedCount === 0) {
            return NextResponse.json({ message: "更新失败" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "个人信息更新成功" });
    } catch (error) {
        console.error("更新用户信息错误:", error);
        return NextResponse.json({ message: "服务器错误" }, { status: 500 });
    }
}
