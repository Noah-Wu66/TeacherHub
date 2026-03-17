import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { getAuthenticatedRoomPlayerId } from '@/lib/24-point/playerSession'
import { getPusherServer } from '@/lib/24-point/pusher'
import { requireAnyUser, toPublicUser } from '@/lib/platform/auth'
import { countFilledSudokuCells, createSudokuBoard } from '@/lib/sudoku/board'
import { SudokuRoomModel } from '@/lib/sudoku/models/Room'
import { pickSudokuPuzzle } from '@/lib/sudoku/puzzles'
import { getSudokuRoomChannelName } from '@/lib/sudoku/realtime'
import { markSudokuPlayerSeen, pruneInactiveWaitingPlayers, toClientSudokuRoom } from '@/lib/sudoku/roomPayload'
import type { SudokuDifficulty, SudokuSize } from '@/types/sudoku'

function isValidSize(size: unknown): size is SudokuSize {
  return size === '4x4' || size === '6x6' || size === '9x9'
}

function isValidDifficulty(difficulty: unknown): difficulty is SudokuDifficulty {
  return difficulty === 'easy' || difficulty === 'normal' || difficulty === 'hard'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    await connectDB()
    const { roomId } = await params
    const room = await SudokuRoomModel.findOne({ roomId })
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    if (pruneInactiveWaitingPlayers(room)) {
      if (room.players.length === 0) {
        await SudokuRoomModel.deleteOne({ roomId })
        return NextResponse.json({ error: '房间不存在' }, { status: 404 })
      }
      await room.save()
    }

    return NextResponse.json({ room: toClientSudokuRoom(room) })
  } catch (error) {
    console.error('获取数独房间失败:', error)
    return NextResponse.json({ error: '获取房间失败' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const currentUser = await requireAnyUser()
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await connectDB()
    const { roomId } = await params
    const { action, size, difficulty } = await request.json()
    const room = await SudokuRoomModel.findOne({ roomId })
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    const authenticatedPlayerId = await getAuthenticatedRoomPlayerId(roomId)
    const authenticatedPlayer = authenticatedPlayerId
      ? room.players.find((player) => player.accountId === authenticatedPlayerId)
      : null
    if (authenticatedPlayer) {
      markSudokuPlayerSeen(authenticatedPlayer)
    }
    if (pruneInactiveWaitingPlayers(room)) {
      if (room.players.length === 0) {
        await SudokuRoomModel.deleteOne({ roomId })
        return NextResponse.json({ error: '房间已失效' }, { status: 404 })
      }
      await room.save()
    }
    const caller = authenticatedPlayerId
      ? room.players.find((player) => player.accountId === authenticatedPlayerId)
      : null

    const pusher = getPusherServer()
    const channelName = getSudokuRoomChannelName(roomId)

    switch (action) {
      case 'join': {
        const existing = room.players.find((player) => player.accountId === String(currentUser._id))
        if (existing) {
          markSudokuPlayerSeen(existing)
          await room.save()
          return NextResponse.json({
            room: toClientSudokuRoom(room),
            playerId: existing.id,
          })
        }

        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '房间已经开始比赛' }, { status: 400 })
        }
        if (room.players.length >= 2) {
          return NextResponse.json({ error: '房间已满' }, { status: 400 })
        }

        const publicUser = toPublicUser(currentUser)
        const playerId = publicUser.id
        room.players.push({
          id: playerId,
          accountId: playerId,
          accountType: publicUser.accountType,
          displayName: publicUser.displayName,
          nickname: publicUser.displayName,
          isHost: false,
          connected: true,
          lastSeenAt: new Date(),
          progress: {
            board: [],
            filledCount: 0,
            errorCount: 0,
            completedAt: null,
          },
        })
        await room.save()

        await pusher.trigger(channelName, 'player-joined', {
          players: room.players,
        })

        return NextResponse.json({
          room: toClientSudokuRoom(room),
          playerId,
        })
      }

      case 'start': {
        if (!caller?.isHost) {
          return NextResponse.json({ error: '只有房主可以开始' }, { status: 403 })
        }
        if (room.players.length < 2) {
          return NextResponse.json({ error: '需要两名玩家才能开始' }, { status: 400 })
        }
        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '比赛已经开始' }, { status: 400 })
        }

        const puzzle = pickSudokuPuzzle(room.size, room.difficulty)
        room.status = 'playing'
        room.puzzleId = puzzle.id
        room.puzzle = puzzle
        room.startedAt = new Date()
        room.finishedAt = null
        room.winner = null
        room.winnerNickname = null
        room.players.forEach((player) => {
          markSudokuPlayerSeen(player)
          player.progress.board = createSudokuBoard(puzzle.initial)
          player.progress.filledCount = countFilledSudokuCells(puzzle.initial)
          player.progress.errorCount = 0
          player.progress.completedAt = null
        })
        await room.save()

        await pusher.trigger(channelName, 'game-start', {
          room: toClientSudokuRoom(room),
        })

        return NextResponse.json({ room: toClientSudokuRoom(room) })
      }

      case 'leave': {
        if (!caller || !authenticatedPlayerId) {
          return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        room.players = room.players.filter((player) => player.accountId !== authenticatedPlayerId) as typeof room.players
        if (room.players.length === 0) {
          await SudokuRoomModel.deleteOne({ roomId })
        } else {
          if (!room.players.some((player) => player.isHost)) {
            room.players[0].isHost = true
          }
          await room.save()
        }

        await pusher.trigger(channelName, 'player-left', {
          playerId: authenticatedPlayerId,
          players: room.players,
        })

        return NextResponse.json({ success: true })
      }

      case 'surrender': {
        if (!caller || !authenticatedPlayerId) {
          return NextResponse.json({ error: '未授权' }, { status: 401 })
        }
        if (room.status !== 'playing') {
          return NextResponse.json({ error: '当前不在比赛中' }, { status: 400 })
        }

        const winner = room.players.find((player) => player.accountId !== authenticatedPlayerId) || null
        const surrenderPlayer = room.players.find((player) => player.accountId === authenticatedPlayerId) || null
        if (surrenderPlayer) {
          surrenderPlayer.connected = false
        }
        room.status = 'finished'
        room.finishedAt = new Date()
        room.winner = winner?.accountId || null
        room.winnerNickname = winner?.nickname || winner?.displayName || null
        await room.save()

        await pusher.trigger(channelName, 'player-surrendered', {
          playerId: authenticatedPlayerId,
          nickname: surrenderPlayer?.nickname || surrenderPlayer?.displayName || '未知玩家',
          players: room.players,
        })

        await pusher.trigger(channelName, 'game-end', {
          winner: room.winner,
          winnerNickname: room.winnerNickname,
          players: room.players,
        })

        return NextResponse.json({ success: true, room: toClientSudokuRoom(room) })
      }

      case 'update-settings': {
        if (!caller?.isHost) {
          return NextResponse.json({ error: '只有房主可以修改设置' }, { status: 403 })
        }
        if (room.status !== 'waiting') {
          return NextResponse.json({ error: '比赛已经开始，不能再修改' }, { status: 400 })
        }
        if (size !== undefined) {
          if (!isValidSize(size)) {
            return NextResponse.json({ error: '盘面规格不正确' }, { status: 400 })
          }
          room.size = size
        }
        if (difficulty !== undefined) {
          if (!isValidDifficulty(difficulty)) {
            return NextResponse.json({ error: '难度不正确' }, { status: 400 })
          }
          room.difficulty = difficulty
        }
        await room.save()

        await pusher.trigger(channelName, 'settings-updated', {
          size: room.size,
          difficulty: room.difficulty,
        })

        return NextResponse.json({ room: toClientSudokuRoom(room) })
      }

      case 'heartbeat': {
        if (!caller) {
          return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        markSudokuPlayerSeen(caller)
        await room.save()
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('更新数独房间失败:', error)
    return NextResponse.json({ error: '更新房间失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    await connectDB()
    const { roomId } = await params
    const authenticatedPlayerId = await getAuthenticatedRoomPlayerId(roomId)
    if (!authenticatedPlayerId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const room = await SudokuRoomModel.findOne({ roomId })
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }
    const caller = room.players.find((player) => player.accountId === authenticatedPlayerId)
    if (!caller?.isHost) {
      return NextResponse.json({ error: '只有房主可以删除房间' }, { status: 403 })
    }

    await SudokuRoomModel.deleteOne({ roomId })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除数独房间失败:', error)
    return NextResponse.json({ error: '删除房间失败' }, { status: 500 })
  }
}
