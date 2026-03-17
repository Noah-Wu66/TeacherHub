import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { getAuthenticatedRoomPlayerId } from '@/lib/24-point/playerSession'
import { getPusherServer } from '@/lib/24-point/pusher'
import { countFilledSudokuCells, isSudokuBoardStateValid } from '@/lib/sudoku/board'
import { SudokuRoomModel } from '@/lib/sudoku/models/Room'
import { markSudokuPlayerSeen } from '@/lib/sudoku/roomPayload'
import { getSudokuRoomChannelName } from '@/lib/sudoku/realtime'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params
    const authenticatedPlayerId = await getAuthenticatedRoomPlayerId(roomId)
    if (!authenticatedPlayerId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { board, errorCount } = await request.json()
    await connectDB()

    const room = await SudokuRoomModel.findOne({ roomId })
    if (!room || room.status !== 'playing' || !room.puzzle) {
      return NextResponse.json({ error: '房间不在比赛中' }, { status: 400 })
    }

    const player = room.players.find((item) => item.accountId === authenticatedPlayerId)
    if (!player) {
      return NextResponse.json({ error: '房间成员不存在' }, { status: 403 })
    }

    if (!isSudokuBoardStateValid(board, room.puzzle)) {
      return NextResponse.json({ error: '棋盘状态不合法' }, { status: 400 })
    }

    markSudokuPlayerSeen(player)
    player.progress.board = board
    player.progress.filledCount = countFilledSudokuCells(board)
    player.progress.errorCount = Math.max(0, Math.trunc(Number(errorCount) || 0))
    await room.save()

    const pusher = getPusherServer()
    await pusher.trigger(getSudokuRoomChannelName(roomId), 'progress-updated', {
      playerId: authenticatedPlayerId,
      filledCount: player.progress.filledCount,
      errorCount: player.progress.errorCount,
      completedAt: player.progress.completedAt ? player.progress.completedAt.toISOString() : null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('同步数独进度失败:', error)
    return NextResponse.json({ error: '同步进度失败' }, { status: 500 })
  }
}
