import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { requireAnyUser, toPublicUser } from '@/lib/platform/auth'
import { SudokuRoomModel } from '@/lib/sudoku/models/Room'
import { pruneInactiveWaitingPlayers, toClientSudokuRoom } from '@/lib/sudoku/roomPayload'
import type { SudokuDifficulty, SudokuSize } from '@/types/sudoku'

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let index = 0; index < 6; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function isValidSize(size: unknown): size is SudokuSize {
  return size === '4x4' || size === '6x6' || size === '9x9'
}

function isValidDifficulty(difficulty: unknown): difficulty is SudokuDifficulty {
  return difficulty === 'easy' || difficulty === 'normal' || difficulty === 'hard'
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAnyUser()
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { roomName, size, difficulty } = await request.json()
    if (!roomName || !String(roomName).trim()) {
      return NextResponse.json({ error: '请输入房间名称' }, { status: 400 })
    }
    if (!isValidSize(size) || !isValidDifficulty(difficulty)) {
      return NextResponse.json({ error: '房间设置不正确' }, { status: 400 })
    }

    await connectDB()

    let roomId = generateRoomId()
    let exists = await SudokuRoomModel.findOne({ roomId })
    let retries = 0
    while (exists && retries < 10) {
      roomId = generateRoomId()
      exists = await SudokuRoomModel.findOne({ roomId })
      retries += 1
    }

    const publicUser = toPublicUser(currentUser)
    const playerId = publicUser.id
    const room = await SudokuRoomModel.create({
      roomId,
      roomName: String(roomName).trim(),
      status: 'waiting',
      size,
      difficulty,
      players: [{
        id: playerId,
        accountId: playerId,
        accountType: publicUser.accountType,
        displayName: publicUser.displayName,
        nickname: publicUser.displayName,
        isHost: true,
        connected: true,
        lastSeenAt: new Date(),
        progress: {
          board: [],
          filledCount: 0,
          errorCount: 0,
          completedAt: null,
        },
      }],
      puzzleId: null,
      puzzle: null,
      winner: null,
      winnerNickname: null,
      startedAt: null,
      finishedAt: null,
    })

    return NextResponse.json({
      room: toClientSudokuRoom(room),
      playerId,
    })
  } catch (error) {
    console.error('创建数独房间失败:', error)
    return NextResponse.json({ error: '创建房间失败' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const currentUser = await requireAnyUser()
    if (!currentUser) {
      return NextResponse.json({ rooms: [] }, { status: 401 })
    }

    await connectDB()
    const rooms = await SudokuRoomModel.find({ status: 'waiting' })
      .sort({ createdAt: -1 })
      .limit(20)
    const visibleRooms = []

    for (const room of rooms) {
      if (pruneInactiveWaitingPlayers(room)) {
        if (room.players.length === 0) {
          await SudokuRoomModel.deleteOne({ roomId: room.roomId })
          continue
        }
        await room.save()
      }

      if (room.players.length < 2) {
        visibleRooms.push(toClientSudokuRoom(room))
      }
    }

    return NextResponse.json({
      rooms: visibleRooms,
    })
  } catch (error) {
    console.error('获取数独房间列表失败:', error)
    return NextResponse.json({ error: '获取房间列表失败' }, { status: 500 })
  }
}
