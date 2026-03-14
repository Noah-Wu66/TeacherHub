'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useNickname } from '@/hooks/24-point/useNickname'
import { useRoom } from '@/hooks/24-point/useRoom'
import { useGame } from '@/hooks/24-point/useGame'
import { usePusher } from '@/hooks/24-point/usePusher'
import NicknameInput from '@/components/24-point/ui/NicknameInput'
import Modal from '@/components/24-point/ui/Modal'
import Button from '@/components/24-point/ui/Button'
import RoomLobby from '@/components/24-point/multiplayer/RoomLobby'
import OpponentPanel from '@/components/24-point/multiplayer/OpponentPanel'
import GameBoard from '@/components/24-point/game/GameBoard'
import GameResult from '@/components/24-point/game/GameResult'
import type {
  Player,
  PlayerRole,
  PusherPlayerJoinedData,
  PusherGameStartData,
  PusherExpressionUpdateData,
  PusherAnswerSubmittedData,
  PusherRoundEndData,
  PusherGameEndData,
  PusherRoleChangedData,
  PusherSettingsUpdatedData,
  PusherPlayerSurrenderedData,
} from '@/types/24-point'

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const { nickname, setNickname, hasNickname, isReady } = useNickname()
  const { room, setRoom, fetchRoom, loading, error } = useRoom()

  const [playerId, setPlayerId] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [opponentExpression, setOpponentExpression] = useState('')
  const [opponentFeedback, setOpponentFeedback] = useState<'success' | 'error' | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [finalScores, setFinalScores] = useState<Record<string, number>>({})
  const [winnerNickname, setWinnerNickname] = useState<string | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [surrenderMessage, setSurrenderMessage] = useState<string | null>(null)

  // 房间设置（从 room 同步，可被 Pusher 事件更新）
  const [totalRounds, setTotalRounds] = useState(5)
  const [timePerRound, setTimePerRound] = useState(60)

  const game = useGame({ totalRounds, timePerRound })

  const opponentFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pusher 连接
  const { isConnected, on } = usePusher(roomId ? `room-${roomId}` : null)

  // 同步 room 设置到本地 state
  useEffect(() => {
    if (room) {
      setTotalRounds(room.totalRounds)
      setTimePerRound(room.timePerRound)
    }
  }, [room])

  // 加载房间信息
  useEffect(() => {
    if (!roomId || !isReady || !hasNickname) return

    const pid = sessionStorage.getItem(`room-${roomId}-playerId`) || ''
    setPlayerId(pid)

    fetchRoom(roomId).then((r) => {
      if (r) {
        setPlayers(r.players)
        if (r.status === 'playing') {
          setGameStarted(true)
          game.startRoundWithNumbers(r.currentNumbers)
          game.setRound(r.currentRound)
        }
      }
    })
  }, [roomId, isReady, hasNickname]) // eslint-disable-line react-hooks/exhaustive-deps

  // 监听 Pusher 事件
  useEffect(() => {
    if (!isConnected) return

    const unsubs: (() => void)[] = []

    // 玩家加入
    unsubs.push(on('player-joined', (data: unknown) => {
      const d = data as PusherPlayerJoinedData
      setPlayers(d.players)
    }))

    // 玩家离开
    unsubs.push(on('player-left', (data: unknown) => {
      const d = data as { playerId: string; players: Player[] }
      setPlayers(d.players)
      if (d.players.filter((p) => p.role === 'player').length < 2 && gameStarted) {
        setGameEnded(true)
      }
    }))

    // 玩家认输
    unsubs.push(on('player-surrendered', (data: unknown) => {
      const d = data as PusherPlayerSurrenderedData
      setPlayers(d.players)
      setSurrenderMessage(`${d.nickname} 已认输离开`)
      setGameEnded(true)
      game.setIsPlaying(false)
      game.setIsFinished(true)
    }))

    // 角色变更
    unsubs.push(on('role-changed', (data: unknown) => {
      const d = data as PusherRoleChangedData
      setPlayers(d.players)
    }))

    // 设置更新
    unsubs.push(on('settings-updated', (data: unknown) => {
      const d = data as PusherSettingsUpdatedData
      setTotalRounds(d.totalRounds)
      setTimePerRound(d.timePerRound)
    }))

    // 游戏开始
    unsubs.push(on('game-start', (data: unknown) => {
      const d = data as PusherGameStartData
      setGameStarted(true)
      setGameEnded(false)
      setSurrenderMessage(null)
      setOpponentExpression('')
      game.startRoundWithNumbers(d.numbers)
      game.setRound(d.round)
    }))

    // 对手表达式更新
    unsubs.push(on('expression-update', (data: unknown) => {
      const d = data as PusherExpressionUpdateData
      if (d.playerId !== playerId) {
        setOpponentExpression(d.expression)
      }
    }))

    // 答案提交
    unsubs.push(on('answer-submitted', (data: unknown) => {
      const d = data as PusherAnswerSubmittedData
      if (d.playerId !== playerId) {
        setOpponentFeedback(d.isCorrect ? 'success' : 'error')
        if (opponentFeedbackTimer.current) clearTimeout(opponentFeedbackTimer.current)
        opponentFeedbackTimer.current = setTimeout(() => setOpponentFeedback(null), 1500)
      }
    }))

    // 轮次结束
    unsubs.push(on('round-end', (data: unknown) => {
      const d = data as PusherRoundEndData
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          score: d.scores[p.id] ?? p.score,
        }))
      )

      if (d.nextNumbers) {
        setTimeout(() => {
          setOpponentExpression('')
          game.startRoundWithNumbers(d.nextNumbers!)
          game.setRound(d.round + 1)
        }, 1500)
      }
    }))

    // 游戏结束
    unsubs.push(on('game-end', (data: unknown) => {
      const d = data as PusherGameEndData
      setFinalScores(d.scores)
      setWinnerNickname(d.winnerNickname)
      setGameEnded(true)
      game.setIsPlaying(false)
      game.setIsFinished(true)
    }))

    return () => {
      unsubs.forEach((u) => u())
    }
  }, [isConnected, playerId, gameStarted]) // eslint-disable-line react-hooks/exhaustive-deps

  // 同步自己的表达式给对手
  useEffect(() => {
    if (!gameStarted || !roomId || !playerId) return

    const sendExpression = async () => {
      await fetch('/24-point/api/pusher/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'expression-update',
          channel: `room-${roomId}`,
          data: { playerId, expression: game.expression },
        }),
      })
    }

    const timer = setTimeout(sendExpression, 500) // 防抖
    return () => clearTimeout(timer)
  }, [game.expression, gameStarted, roomId, playerId])

  // 提交答案（覆盖 useGame 的 handleSubmit）
  const handleMultiplayerSubmit = useCallback(async () => {
    const res = await fetch('/24-point/api/game/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        expression: game.expression,
        numbers: game.numbers,
        usedNumbers: game.usedNumbers,
        playerId,
      }),
    })
    const data = await res.json()
    if (data.isCorrect) {
      game.handleSubmit()
    } else {
      game.handleSubmit()
    }
  }, [roomId, game, playerId])

  // 开始游戏（房主操作）
  const handleStartGame = async () => {
    await fetch(`/24-point/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    })
  }

  // 离开房间（等待阶段）
  const handleLeave = async () => {
    await fetch(`/24-point/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave', playerId }),
    })
    sessionStorage.removeItem(`room-${roomId}-playerId`)
    router.push('/multiplayer')
  }

  // 认输离开（游戏进行中）
  const handleSurrender = async () => {
    setShowLeaveConfirm(false)
    await fetch(`/24-point/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'surrender', playerId }),
    })
    sessionStorage.removeItem(`room-${roomId}-playerId`)
    router.push('/multiplayer')
  }

  // 设置角色
  const handleSetRole = async (targetPlayerId: string, role: PlayerRole) => {
    await fetch(`/24-point/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-role', playerId, targetPlayerId, role }),
    })
  }

  // 更新设置
  const handleUpdateSettings = async (settings: { totalRounds?: number; timePerRound?: number }) => {
    await fetch(`/24-point/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-settings', playerId, ...settings }),
    })
  }

  if (!isReady) return null

  const me = players.find((p) => p.id === playerId)
  const isHost = me?.isHost || false
  const isObserver = me?.role === 'observer'

  // 对战双方（只看 role=player 的人）
  const gamePlayers = players.filter((p) => p.role === 'player')
  const opponent = gamePlayers.find((p) => p.id !== playerId)

  const myScore = finalScores[playerId] ?? me?.score ?? game.score
  const opponentScore = opponent ? (finalScores[opponent.id] ?? opponent.score) : 0

  return (
    <div className="min-h-dvh flex flex-col items-center px-3 sm:px-4 py-2 sm:py-6">
      <NicknameInput open={!hasNickname} onSubmit={setNickname} />

      {/* 顶部导航 */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3 sm:mb-6">
        <button
          onClick={() => {
            if (gameStarted && !gameEnded) {
              setShowLeaveConfirm(true)
            } else {
              handleLeave()
            }
          }}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors cursor-pointer min-h-[44px] min-w-[44px] px-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          离开
        </button>
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-700">
          {room?.roomName || '对战房间'}
        </h1>
        <div className="text-xs text-gray-400 font-mono min-w-[44px] text-right">{roomId}</div>
      </div>

      {/* 加载/错误 */}
      {loading && !room && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">加载中...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3 mb-4 w-full max-w-md">
          {error}
          <Link href="/24-point/multiplayer" className="block mt-2 text-indigo-400 underline">
            返回大厅
          </Link>
        </div>
      )}

      {/* 等待阶段 */}
      {room && !gameStarted && (
        <RoomLobby
          roomId={roomId}
          roomName={room.roomName}
          players={players}
          isHost={isHost}
          totalRounds={totalRounds}
          timePerRound={timePerRound}
          onStart={handleStartGame}
          onLeave={handleLeave}
          onSetRole={handleSetRole}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* 观察者提示 */}
      {gameStarted && !gameEnded && isObserver && (
        <div className="w-full max-w-3xl mb-3">
          <div className="text-center text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-2 border border-gray-100">
            👁 你正在观战
          </div>
        </div>
      )}

      {/* 对战阶段 */}
      {gameStarted && !gameEnded && !isObserver && (
        <div className="w-full max-w-3xl animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            {/* 我的面板 */}
            <GameBoard
              numbers={game.numbers}
              expression={game.expression}
              usedNumbers={game.usedNumbers}
              timeLeft={game.timeLeft}
              feedback={game.feedback}
              isPlaying={game.isPlaying}
              hint={game.hint}
              playerName={me?.nickname || nickname || '我'}
              playerScore={myScore}
              opponentName={opponent?.nickname || '对手'}
              opponentScore={opponentScore}
              round={game.round}
              totalRounds={totalRounds}
              onNumberClick={game.handleNumberClick}
              onOperator={game.handleOperator}
              onBackspace={game.handleBackspace}
              onClear={game.handleClear}
              onSubmit={handleMultiplayerSubmit}
              onHint={game.handleHint}
              onSkip={game.handleSkip}
              showHint={false}
            />

            {/* 对手面板 */}
            {opponent && (
              <OpponentPanel
                nickname={opponent.nickname}
                score={opponentScore}
                numbers={game.numbers}
                expression={opponentExpression}
                feedback={opponentFeedback}
              />
            )}
          </div>
        </div>
      )}

      {/* 观察者看到的对战面板（双方都是只读） */}
      {gameStarted && !gameEnded && isObserver && (
        <div className="w-full max-w-3xl animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            {gamePlayers.map((p) => (
              <OpponentPanel
                key={p.id}
                nickname={p.nickname}
                score={finalScores[p.id] ?? p.score}
                numbers={game.numbers}
                expression={p.id === playerId ? game.expression : opponentExpression}
                feedback={null}
              />
            ))}
          </div>
        </div>
      )}

      {/* 结果弹窗 */}
      <GameResult
        open={gameEnded}
        playerName={me?.nickname || nickname || '我'}
        playerScore={myScore}
        opponentName={opponent?.nickname || '对手'}
        opponentScore={opponentScore}
        totalRounds={totalRounds}
        onPlayAgain={() => router.push('/multiplayer')}
        onExit={() => router.push('/')}
      />

      {/* 认输提示（对方认输时显示在结果弹窗里） */}
      {surrenderMessage && gameEnded && (
        <Modal open={!!surrenderMessage && gameEnded} onClose={() => setSurrenderMessage(null)} title="对局结束">
          <div className="space-y-4">
            <p className="text-center text-gray-500">{surrenderMessage}</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>
                返回首页
              </Button>
              <Button className="flex-1" onClick={() => router.push('/multiplayer')}>
                返回大厅
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 游戏中离开确认弹窗 */}
      <Modal open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} title="确认离开">
        <div className="space-y-4">
          <p className="text-center text-gray-500">
            {gameStarted && !gameEnded
              ? '游戏进行中，离开将视为认输，确定要离开吗？'
              : '确定要离开房间吗？'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowLeaveConfirm(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={gameStarted && !gameEnded ? handleSurrender : handleLeave}
            >
              {gameStarted && !gameEnded ? '认输离开' : '确认离开'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
