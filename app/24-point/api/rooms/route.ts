import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { Room } from '@/lib/24-point/models/Room'
import { generateNumbers } from '@/lib/24-point/gameLogic'
import { hasSolution } from '@/lib/24-point/solver'
import { getPusherServer } from '@/lib/24-point/pusher'

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
    await connectDB()

    const { roomName, nickname, totalRounds = 5, timePerRound = 60 } = await request.json()

    if (!roomName || !nickname) {
      return NextResponse.json({ error: '缺少房间名或昵称' }, { status: 400 })
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

    const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const room = await Room.create({
      roomId,
      roomName,
      status: 'waiting',
      players: [{
        id: playerId,
        nickname,
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

    return NextResponse.json({
      room: room.toObject(),
      playerId,
    })
  } catch (error) {
    console.error('创建房间失败:', error)
    return NextResponse.json({ error: '创建房间失败' }, { status: 500 })
  }
}

// GET — 获取可加入的房间列表
export async function GET() {
  try {
    await connectDB()

    const rooms = await Room.find({
      status: 'waiting',
      'players.1': { $exists: false }, // 只有1个玩家的房间
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('获取房间列表失败:', error)
    return NextResponse.json({ error: '获取房间列表失败' }, { status: 500 })
  }
}
