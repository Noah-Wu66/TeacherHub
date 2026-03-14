import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/ai-education/mongodb'
import { COLLECTIONS, TOOL_CHAT_HISTORY_FIELDS } from '@/lib/ai-education/models'
import { requireAnyUser } from '@/lib/platform/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireAnyUser()
    if (!user) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const histories = await getCollection(COLLECTIONS.toolChatHistories)
    const history = await histories.findOne({
      [TOOL_CHAT_HISTORY_FIELDS.userId]: user._id,
      [TOOL_CHAT_HISTORY_FIELDS.tool]: 'tugui',
    })

    return NextResponse.json({ messages: history?.[TOOL_CHAT_HISTORY_FIELDS.messages] || [] })
  } catch (error) {
    console.error('[tugui/history][GET] failed:', error)
    return NextResponse.json({ message: '获取聊天记录失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAnyUser()
    if (!user) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const histories = await getCollection(COLLECTIONS.toolChatHistories)

    await histories.updateOne(
      {
        [TOOL_CHAT_HISTORY_FIELDS.userId]: user._id,
        [TOOL_CHAT_HISTORY_FIELDS.tool]: 'tugui',
      },
      {
        $set: {
          [TOOL_CHAT_HISTORY_FIELDS.userId]: user._id,
          [TOOL_CHAT_HISTORY_FIELDS.tool]: 'tugui',
          [TOOL_CHAT_HISTORY_FIELDS.messages]: messages,
          [TOOL_CHAT_HISTORY_FIELDS.updatedAt]: new Date(),
        },
        $setOnInsert: {
          [TOOL_CHAT_HISTORY_FIELDS.createdAt]: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[tugui/history][POST] failed:', error)
    return NextResponse.json({ message: '保存聊天记录失败' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await requireAnyUser()
    if (!user) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const histories = await getCollection(COLLECTIONS.toolChatHistories)
    await histories.deleteOne({
      [TOOL_CHAT_HISTORY_FIELDS.userId]: user._id,
      [TOOL_CHAT_HISTORY_FIELDS.tool]: 'tugui',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[tugui/history][DELETE] failed:', error)
    return NextResponse.json({ message: '删除聊天记录失败' }, { status: 500 })
  }
}
