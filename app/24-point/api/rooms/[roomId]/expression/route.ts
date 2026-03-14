import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { Room } from '@/lib/24-point/models/Room'
import { getPusherServer } from '@/lib/24-point/pusher'
import { getAuthenticatedRoomPlayerId } from '@/lib/24-point/playerSession'
import { getRoomChannelName } from '@/lib/24-point/realtime'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connectDB()
    const { roomId } = await params
    const authenticatedPlayerId = await getAuthenticatedRoomPlayerId(roomId)

    if (!authenticatedPlayerId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const expression = typeof body?.expression === 'string' ? body.expression : ''

    const room = await Room.findOne({ roomId }).lean()
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    if (room.status !== 'playing') {
      return NextResponse.json({ error: '房间不在游戏中' }, { status: 400 })
    }

    const player = room.players.find((item) => item.accountId === authenticatedPlayerId)
    if (!player || player.role !== 'player') {
      return NextResponse.json({ error: '无权发送表达式' }, { status: 403 })
    }

    await getPusherServer().trigger(getRoomChannelName(roomId), 'expression-update', {
      playerId: authenticatedPlayerId,
      expression,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('表达式同步失败:', error)
    return NextResponse.json({ error: '表达式同步失败' }, { status: 500 })
  }
}
