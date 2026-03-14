import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { Room } from '@/lib/24-point/models/Room'
import { generateNumbers } from '@/lib/24-point/gameLogic'
import { hasSolution } from '@/lib/24-point/solver'
import { setRoomPlayerCookie } from '@/lib/24-point/playerSession'
import { requireAnyUser, toPublicUser } from '@/lib/platform/auth'

// 生成 6 位房间码
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// 生成保证有解的数字
function generateSolvableNumbers(): number[] {
  let nums: number[]
  let attempts = 0
  do {
    nums = generateNumbers()
    attempts++
  } while (!hasSolution(nums) && attempts < 100)
  return nums
}

// POST — 创建房间
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAnyUser()
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await connectDB()

    const { roomName, totalRounds = 5, timePerRound = 60 } = await request.json()

    if (!roomName) {
      return NextResponse.json({ error: '缺少房间名' }, { status: 400 })
    }

    // 生成唯一房间码
    let roomId = generateRoomId()
    let exists = await Room.findOne({ roomId })
    let retries = 0
    while (exists && retries < 10) {
      roomId = generateRoomId()
      exists = await Room.findOne({ roomId })
      retries++
    }

    const publicUser = toPublicUser(currentUser)
    const playerId = publicUser.id

    const room = await Room.create({
      roomId,
      roomName,
      status: 'waiting',
      players: [{
        id: playerId,
        accountId: playerId,
        accountType: publicUser.accountType,
        displayName: publicUser.displayName,
        nickname: publicUser.displayName,
        score: 0,
        isHost: true,
        connected: true,
        role: 'player',
      }],
      currentRound: 0,
      totalRounds: Math.min(Math.max(totalRounds, 1), 20),
      timePerRound: Math.min(Math.max(timePerRound, 15), 300),
      currentNumbers: [],
      roundResults: [],
    })

    const response = NextResponse.json({
      room: room.toObject(),
      playerId,
    })
    setRoomPlayerCookie(response, roomId, playerId)
    return response
  } catch (error) {
    console.error('创建房间失败:', error)
    return NextResponse.json({ error: '创建房间失败' }, { status: 500 })
  }
}

// GET — 获取可加入的房间列表
export async function GET() {
  try {
    const currentUser = await requireAnyUser()
    if (!currentUser) {
      return NextResponse.json({ rooms: [] }, { status: 401 })
    }

    await connectDB()

    const rooms = await Room.find({
      status: 'waiting',
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const joinableRooms = rooms
      .filter((room) => room.players.filter((player) => player.role === 'player').length < 2)
      .slice(0, 20)

    return NextResponse.json({ rooms: joinableRooms })
  } catch (error) {
    console.error('获取房间列表失败:', error)
    return NextResponse.json({ error: '获取房间列表失败' }, { status: 500 })
  }
}
