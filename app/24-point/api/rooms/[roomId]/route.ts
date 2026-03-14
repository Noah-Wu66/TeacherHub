import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { Room } from '@/lib/24-point/models/Room'
import { generateNumbers } from '@/lib/24-point/gameLogic'
import { hasSolution } from '@/lib/24-point/solver'
import { getPusherServer } from '@/lib/24-point/pusher'

function generateSolvableNumbers(): number[] {
  let nums: number[]
  let attempts = 0
  do {
    nums = generateNumbers()
    attempts++
  } while (!hasSolution(nums) && attempts < 100)
  return nums
}

// GET — 获取房间详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connectDB()
    const { roomId } = await params

    const room = await Room.findOne({ roomId }).lean()
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error('获取房间失败:', error)
    return NextResponse.json({ error: '获取房间失败' }, { status: 500 })
  }
}

// PATCH — 更新房间（加入/开始/离开）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connectDB()
    const { roomId } = await params
    const body = await request.json()
    const { action } = body

    const room = await Room.findOne({ roomId })
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    const pusher = getPusherServer()

    switch (action) {
      case 'join': {
        const { nickname } = body
        if (!nickname) {
          return NextResponse.json({ error: '缺少昵称' }, { status: 400 })
        }
        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '游戏已开始' }, { status: 400 })
        }

        const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        room.players.push({
          id: playerId,
          nickname,
          score: 0,
          isHost: false,
          connected: true,
          role: 'player',
        })
        await room.save()

        // 通知房间内的人
        await pusher.trigger(`room-${roomId}`, 'player-joined', {
          player: room.players[room.players.length - 1],
          players: room.players,
        })

        return NextResponse.json({
          room: room.toObject(),
          playerId,
        })
      }

      case 'start': {
        const activePlayers = room.players.filter((p) => p.role === 'player')
        if (activePlayers.length < 2) {
          return NextResponse.json({ error: '需要至少2名参赛玩家' }, { status: 400 })
        }
        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '游戏已开始' }, { status: 400 })
        }

        const numbers = generateSolvableNumbers()
        room.status = 'playing'
        room.currentRound = 1
        room.currentNumbers = numbers
        room.roundStartedAt = new Date()
        await room.save()

        await pusher.trigger(`room-${roomId}`, 'game-start', {
          numbers,
          round: 1,
          totalRounds: room.totalRounds,
          timePerRound: room.timePerRound,
        })

        return NextResponse.json({ room: room.toObject() })
      }

      case 'leave': {
        const { playerId } = body
        room.players = room.players.filter((p) => p.id !== playerId) as typeof room.players

        if (room.players.length === 0) {
          await Room.deleteOne({ roomId })
        } else {
          // 如果房主离开了，让剩下的人当房主
          if (!room.players.some((p) => p.isHost)) {
            room.players[0].isHost = true
          }
          if (room.status === 'playing') {
            room.status = 'finished'
          }
          await room.save()
        }

        await pusher.trigger(`room-${roomId}`, 'player-left', {
          playerId,
          players: room.players,
        })

        return NextResponse.json({ success: true })
      }

      case 'surrender': {
        // 游戏中离开 = 认输
        const { playerId: surrenderId } = body
        const surrenderPlayer = room.players.find((p) => p.id === surrenderId)

        room.players = room.players.filter((p) => p.id !== surrenderId) as typeof room.players

        if (room.players.length === 0) {
          await Room.deleteOne({ roomId })
        } else {
          if (!room.players.some((p) => p.isHost)) {
            room.players[0].isHost = true
          }
          room.status = 'finished'
          await room.save()
        }

        await pusher.trigger(`room-${roomId}`, 'player-surrendered', {
          playerId: surrenderId,
          nickname: surrenderPlayer?.nickname || '未知',
          players: room.players,
        })

        return NextResponse.json({ success: true })
      }

      case 'set-role': {
        // 房主设置某人为观察者/参赛者
        const { targetPlayerId, role: newRole } = body
        const caller = room.players.find((p) => p.id === body.playerId)
        if (!caller?.isHost) {
          return NextResponse.json({ error: '只有房主可以设置角色' }, { status: 403 })
        }
        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '游戏已开始，无法修改' }, { status: 400 })
        }

        const target = room.players.find((p) => p.id === targetPlayerId)
        if (!target) {
          return NextResponse.json({ error: '玩家不存在' }, { status: 404 })
        }
        if (target.isHost) {
          return NextResponse.json({ error: '不能修改房主角色' }, { status: 400 })
        }

        target.role = newRole
        await room.save()

        await pusher.trigger(`room-${roomId}`, 'role-changed', {
          playerId: targetPlayerId,
          role: newRole,
          players: room.players,
        })

        return NextResponse.json({ room: room.toObject() })
      }

      case 'update-settings': {
        // 房主更新房间设置
        const caller2 = room.players.find((p) => p.id === body.playerId)
        if (!caller2?.isHost) {
          return NextResponse.json({ error: '只有房主可以修改设置' }, { status: 403 })
        }
        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '游戏已开始，无法修改' }, { status: 400 })
        }

        if (body.totalRounds !== undefined) {
          room.totalRounds = Math.min(Math.max(body.totalRounds, 1), 20)
        }
        if (body.timePerRound !== undefined) {
          room.timePerRound = Math.min(Math.max(body.timePerRound, 15), 300)
        }
        await room.save()

        await pusher.trigger(`room-${roomId}`, 'settings-updated', {
          totalRounds: room.totalRounds,
          timePerRound: room.timePerRound,
        })

        return NextResponse.json({ room: room.toObject() })
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('更新房间失败:', error)
    return NextResponse.json({ error: '更新房间失败' }, { status: 500 })
  }
}

// DELETE — 删除房间
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connectDB()
    const { roomId } = await params

    await Room.deleteOne({ roomId })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除房间失败:', error)
    return NextResponse.json({ error: '删除房间失败' }, { status: 500 })
  }
}
