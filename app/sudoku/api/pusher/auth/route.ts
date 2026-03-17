import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { getAuthenticatedRoomPlayerId } from '@/lib/24-point/playerSession'
import { getPusherServer } from '@/lib/24-point/pusher'
import { SudokuRoomModel } from '@/lib/sudoku/models/Room'
import { parseSudokuRoomIdFromChannelName } from '@/lib/sudoku/realtime'

async function parseAuthPayload(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return await request.json()
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    return {
      socket_id: String(formData.get('socket_id') || ''),
      channel_name: String(formData.get('channel_name') || ''),
    }
  }

  const rawText = await request.text()
  const params = new URLSearchParams(rawText)
  return {
    socket_id: params.get('socket_id') || '',
    channel_name: params.get('channel_name') || '',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { socket_id, channel_name } = await parseAuthPayload(request)
    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const roomId = parseSudokuRoomIdFromChannelName(channel_name)
    if (!roomId) {
      return NextResponse.json({ error: '非法频道' }, { status: 400 })
    }

    const authenticatedPlayerId = await getAuthenticatedRoomPlayerId(roomId)
    if (!authenticatedPlayerId) {
      return NextResponse.json({ error: '未授权' }, { status: 403 })
    }

    await connectDB()
    const room = await SudokuRoomModel.findOne({ roomId }).lean()
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    const player = room.players.find((item) => item.accountId === authenticatedPlayerId)
    if (!player) {
      return NextResponse.json({ error: '房间成员不存在' }, { status: 403 })
    }

    const pusher = getPusherServer()
    const authResponse = pusher.authorizeChannel(socket_id, channel_name)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('数独 Pusher 鉴权失败:', error)
    return NextResponse.json({ error: '鉴权失败' }, { status: 500 })
  }
}
