import { NextRequest, NextResponse } from 'next/server'
import { getPusherServer } from '@/lib/24-point/pusher'

// POST — Pusher 鉴权 + 事件中转
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 事件中转模式
    if (body.event && body.channel && body.data) {
      const pusher = getPusherServer()
      await pusher.trigger(body.channel, body.event, body.data)
      return NextResponse.json({ success: true })
    }

    // Pusher 鉴权模式（表单格式）
    const { socket_id, channel_name } = body
    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const pusher = getPusherServer()
    const authResponse = pusher.authorizeChannel(socket_id, channel_name)

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher auth 失败:', error)
    return NextResponse.json({ error: '鉴权失败' }, { status: 500 })
  }
}
