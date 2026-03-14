import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { Room } from '@/lib/24-point/models/Room'
import { generateNumbers } from '@/lib/24-point/gameLogic'
import { hasSolution } from '@/lib/24-point/solver'
import { getPusherServer } from '@/lib/24-point/pusher'
import {
  clearRoomPlayerCookie,
  getAuthenticatedRoomPlayerId,
  setRoomPlayerCookie,
} from '@/lib/24-point/playerSession'
import { getRoomChannelName } from '@/lib/24-point/realtime'
import { requireAnyUser, toPublicUser } from '@/lib/platform/auth'

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
    const currentUser = await requireAnyUser()
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await connectDB()
    const { roomId } = await params
    const body = await request.json()
    const { action } = body

    const room = await Room.findOne({ roomId })
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    const authenticatedPlayerId = await getAuthenticatedRoomPlayerId(roomId)
    const caller = authenticatedPlayerId
      ? room.players.find((p) => p.accountId === authenticatedPlayerId)
      : null

    const pusher = getPusherServer()
    const channelName = getRoomChannelName(roomId)

    switch (action) {
      case 'join': {
        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '游戏已开始' }, { status: 400 })
        }

        const existing = room.players.find((p) => p.accountId === String(currentUser._id))
        if (existing) {
          return NextResponse.json({
            room: room.toObject(),
            playerId: existing.id,
          })
        }

        const activePlayers = room.players.filter((p) => p.role === 'player')
        const nextRole = activePlayers.length >= 2 ? 'observer' : 'player'
        const publicUser = toPublicUser(currentUser)
        const playerId = publicUser.id
        room.players.push({
          id: playerId,
          accountId: playerId,
          accountType: publicUser.accountType,
          displayName: publicUser.displayName,
          nickname: publicUser.displayName,
          score: 0,
          isHost: false,
          connected: true,
          role: nextRole,
        })
        await room.save()

        // 通知房间内的人
        await pusher.trigger(channelName, 'player-joined', {
          player: room.players[room.players.length - 1],
          players: room.players,
        })

        const response = NextResponse.json({
          room: room.toObject(),
          playerId,
        })
        setRoomPlayerCookie(response, roomId, playerId)
        return response
      }

      case 'start': {
        if (!caller) {
          return NextResponse.json({ error: '未授权' }, { status: 401 })
        }
        if (!caller.isHost) {
          return NextResponse.json({ error: '只有房主可以开始游戏' }, { status: 403 })
        }

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

        await pusher.trigger(channelName, 'game-start', {
          numbers,
          round: 1,
          totalRounds: room.totalRounds,
          timePerRound: room.timePerRound,
        })

        return NextResponse.json({ room: room.toObject() })
      }

      case 'leave': {
        if (!caller || !authenticatedPlayerId) {
          return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        room.players = room.players.filter((p) => p.accountId !== authenticatedPlayerId) as typeof room.players

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

        await pusher.trigger(channelName, 'player-left', {
          playerId: authenticatedPlayerId,
          players: room.players,
        })

        const response = NextResponse.json({ success: true })
        clearRoomPlayerCookie(response, roomId)
        return response
      }

      case 'surrender': {
        // 游戏中离开 = 认输
        if (!caller || !authenticatedPlayerId) {
          return NextResponse.json({ error: '未授权' }, { status: 401 })
        }
        const surrenderPlayer = room.players.find((p) => p.accountId === authenticatedPlayerId)

        room.players = room.players.filter((p) => p.accountId !== authenticatedPlayerId) as typeof room.players

        if (room.players.length === 0) {
          await Room.deleteOne({ roomId })
        } else {
          if (!room.players.some((p) => p.isHost)) {
            room.players[0].isHost = true
          }
          room.status = 'finished'
          await room.save()
        }

        await pusher.trigger(channelName, 'player-surrendered', {
          playerId: authenticatedPlayerId,
          nickname: surrenderPlayer?.displayName || surrenderPlayer?.nickname || '未知',
          players: room.players,
        })

        const response = NextResponse.json({ success: true })
        clearRoomPlayerCookie(response, roomId)
        return response
      }

      case 'set-role': {
        // 房主设置某人为观察者/参赛者
        const { targetPlayerId, role: newRole } = body
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
        if (newRole !== 'player' && newRole !== 'observer') {
          return NextResponse.json({ error: '非法角色' }, { status: 400 })
        }
        if (newRole === 'player' && target.role !== 'player') {
          const activePlayers = room.players.filter((p) => p.role === 'player')
          if (activePlayers.length >= 2) {
            return NextResponse.json({ error: '参赛玩家最多只能有2人' }, { status: 400 })
          }
        }

        target.role = newRole
        await room.save()

        await pusher.trigger(channelName, 'role-changed', {
          playerId: targetPlayerId,
          role: newRole,
          players: room.players,
        })

        return NextResponse.json({ room: room.toObject() })
      }

      case 'update-settings': {
        // 房主更新房间设置
        if (!caller?.isHost) {
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

        await pusher.trigger(channelName, 'settings-updated', {
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
    const authenticatedPlayerId = await getAuthenticatedRoomPlayerId(roomId)
    if (!authenticatedPlayerId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const room = await Room.findOne({ roomId })
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    const caller = room.players.find((p) => p.accountId === authenticatedPlayerId)
    if (!caller) {
      return NextResponse.json({ error: '房间成员不存在' }, { status: 403 })
    }
    if (!caller.isHost) {
      return NextResponse.json({ error: '只有房主可以删除房间' }, { status: 403 })
    }

    await Room.deleteOne({ roomId })
    const response = NextResponse.json({ success: true })
    clearRoomPlayerCookie(response, roomId)
    return response
  } catch (error) {
    console.error('删除房间失败:', error)
    return NextResponse.json({ error: '删除房间失败' }, { status: 500 })
  }
}
