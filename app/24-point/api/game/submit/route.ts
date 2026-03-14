import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/24-point/db'
import { Room } from '@/lib/24-point/models/Room'
import { checkAnswer, generateNumbers } from '@/lib/24-point/gameLogic'
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

// POST — 提交答案
export async function POST(request: NextRequest) {
  try {
    const { roomId, expression, numbers, usedNumbers, playerId } = await request.json()

    // 服务端验证答案
    const result = checkAnswer(expression, usedNumbers, numbers)

    // 如果不是联机模式，只返回验证结果
    if (!roomId) {
      return NextResponse.json(result)
    }

    // 联机模式：更新房间状态
    await connectDB()
    const room = await Room.findOne({ roomId })
    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: '房间不在游戏中' }, { status: 400 })
    }

    const pusher = getPusherServer()
    const player = room.players.find((p) => p.id === playerId)

    // 通知双方答案提交结果
    await pusher.trigger(`room-${roomId}`, 'answer-submitted', {
      playerId,
      nickname: player?.nickname || '???',
      isCorrect: result.isCorrect,
      expression,
    })

    if (result.isCorrect) {
      // 本轮胜利
      if (player) {
        player.score += 1
      }

      const timeUsed = room.roundStartedAt
        ? Math.floor((Date.now() - new Date(room.roundStartedAt).getTime()) / 1000)
        : null

      room.roundResults.push({
        round: room.currentRound,
        numbers: room.currentNumbers,
        winner: playerId || null,
        winnerExpression: expression,
        timeUsed,
      })

      const scores: Record<string, number> = {}
      room.players.forEach((p) => {
        scores[p.id] = p.score
      })

      if (room.currentRound >= room.totalRounds) {
        // 游戏结束
        room.status = 'finished'
        await room.save()

        // 判断胜者
        const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
        const winner = sortedPlayers[0].score > sortedPlayers[1].score ? sortedPlayers[0] : null

        await pusher.trigger(`room-${roomId}`, 'game-end', {
          scores,
          winner: winner?.id || null,
          winnerNickname: winner?.nickname || null,
          roundResults: room.roundResults,
        })
      } else {
        // 进入下一轮
        const nextNumbers = generateSolvableNumbers()
        room.currentRound += 1
        room.currentNumbers = nextNumbers
        room.roundStartedAt = new Date()
        await room.save()

        await pusher.trigger(`room-${roomId}`, 'round-end', {
          round: room.currentRound - 1,
          winner: playerId,
          winnerNickname: player?.nickname || null,
          winnerExpression: expression,
          scores,
          nextNumbers,
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('提交答案失败:', error)
    return NextResponse.json({ error: '提交答案失败' }, { status: 500 })
  }
}
