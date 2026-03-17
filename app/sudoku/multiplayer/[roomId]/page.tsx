'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/24-point/ui/Button'
import Card from '@/components/24-point/ui/Card'
import Modal from '@/components/24-point/ui/Modal'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import { useAuth } from '@/components/platform/auth/AuthProvider'
import SudokuBoard from '@/components/sudoku/SudokuBoard'
import SudokuNumberPad from '@/components/sudoku/SudokuNumberPad'
import RaceStatus from '@/components/sudoku/multiplayer/RaceStatus'
import SudokuRoomLobby from '@/components/sudoku/multiplayer/RoomLobby'
import { useSudokuGame } from '@/hooks/sudoku/useSudokuGame'
import { useSudokuPusher } from '@/hooks/sudoku/usePusher'
import { useSudokuRoom } from '@/hooks/sudoku/useRoom'
import { isSudokuBoardCompleteByRules } from '@/lib/sudoku/board'
import { getSudokuRoomChannelName } from '@/lib/sudoku/realtime'
import {
  SUDOKU_DIFFICULTY_LABELS,
  SUDOKU_SIZE_CONFIG,
  type SudokuDifficulty,
  type SudokuPlayer,
  type SudokuPusherGameEndData,
  type SudokuPusherGameStartData,
  type SudokuPusherPlayerJoinedData,
  type SudokuPusherPlayerLeftData,
  type SudokuPusherPlayerSurrenderedData,
  type SudokuPusherProgressUpdatedData,
  type SudokuPusherSettingsUpdatedData,
  type SudokuRoom,
  type SudokuSize,
} from '@/types/sudoku'

export default function SudokuRoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string
  const { user } = useAuth()
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用数独挑战。',
  })
  const { room, setRoom, fetchRoom, loading, error } = useSudokuRoom()
  const game = useSudokuGame({ validationMode: 'rule' })
  const { isConnected, on } = useSudokuPusher(roomId ? getSudokuRoomChannelName(roomId) : null)

  const [players, setPlayers] = useState<SudokuPlayer[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [surrenderMessage, setSurrenderMessage] = useState<string | null>(null)
  const [winnerNickname, setWinnerNickname] = useState<string | null>(null)
  const progressSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completeSentRef = useRef(false)

  const playerId = user?.id || ''
  const readyToComplete = useMemo(() => {
    if (!room?.puzzle) {
      return false
    }
    return isSudokuBoardCompleteByRules(game.board, room.puzzle)
  }, [game.board, room?.puzzle])

  const hydrateRoomState = useCallback((nextRoom: SudokuRoom) => {
    setRoom(nextRoom)
    setPlayers(nextRoom.players)
    setGameStarted(nextRoom.status !== 'waiting')
    setGameEnded(nextRoom.status === 'finished')
    setWinnerNickname(nextRoom.winnerNickname)
    completeSentRef.current = nextRoom.status === 'finished'

    const me = nextRoom.players.find((player) => player.accountId === playerId)
    if (nextRoom.puzzle) {
      const restoredBoard =
        me?.progress.board && me.progress.board.length > 0
          ? me.progress.board
          : nextRoom.puzzle.initial

      game.loadPuzzle(nextRoom.puzzle, {
        board: restoredBoard,
        errorCount: me?.progress.errorCount ?? 0,
        startedAt: nextRoom.startedAt,
        completedAt: me?.progress.completedAt ?? null,
      })
    }
  }, [game.loadPuzzle, playerId, setRoom])

  useEffect(() => {
    if (!roomId || !playerId || access.loading || !access.allowed) return
    fetchRoom(roomId).then((nextRoom) => {
      if (nextRoom) {
        hydrateRoomState(nextRoom)
      }
    })
  }, [access.allowed, access.loading, fetchRoom, hydrateRoomState, playerId, roomId])

  useEffect(() => {
    if (!roomId || !playerId || access.loading || !access.allowed) return

    const sendHeartbeat = async () => {
      await fetch(`/sudoku/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat' }),
      }).catch(() => undefined)
    }

    sendHeartbeat()
    const timer = setInterval(sendHeartbeat, 10_000)

    return () => clearInterval(timer)
  }, [access.allowed, access.loading, playerId, roomId])

  useEffect(() => {
    if (!isConnected) return

    const unsubs: Array<() => void> = []

    unsubs.push(on('player-joined', (data: unknown) => {
      const event = data as SudokuPusherPlayerJoinedData
      setPlayers(event.players)
      setRoom((prev) => (prev ? { ...prev, players: event.players } : prev))
    }))

    unsubs.push(on('player-left', (data: unknown) => {
      const event = data as SudokuPusherPlayerLeftData
      setPlayers(event.players)
      setRoom((prev) => (prev ? { ...prev, players: event.players } : prev))
    }))

    unsubs.push(on('settings-updated', (data: unknown) => {
      const event = data as SudokuPusherSettingsUpdatedData
      setRoom((prev) => (prev ? { ...prev, size: event.size as SudokuSize, difficulty: event.difficulty as SudokuDifficulty } : prev))
    }))

    unsubs.push(on('game-start', (data: unknown) => {
      const event = data as SudokuPusherGameStartData
      hydrateRoomState(event.room)
      setSurrenderMessage(null)
    }))

    unsubs.push(on('progress-updated', (data: unknown) => {
      const event = data as SudokuPusherProgressUpdatedData
      setPlayers((prev) =>
        prev.map((player) =>
          player.accountId === event.playerId
            ? {
                ...player,
                progress: {
                  ...player.progress,
                  filledCount: event.filledCount,
                  errorCount: event.errorCount,
                  completedAt: event.completedAt,
                },
              }
            : player,
        ),
      )
    }))

    unsubs.push(on('player-surrendered', (data: unknown) => {
      const event = data as SudokuPusherPlayerSurrenderedData
      setSurrenderMessage(`${event.nickname} 已认输离开`)
      setPlayers(event.players)
    }))

    unsubs.push(on('game-end', (data: unknown) => {
      const event = data as SudokuPusherGameEndData
      setPlayers(event.players)
      setGameEnded(true)
      setWinnerNickname(event.winnerNickname)
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              status: 'finished',
              players: event.players,
              winner: event.winner,
              winnerNickname: event.winnerNickname,
            }
          : prev,
      )
    }))

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe())
    }
  }, [hydrateRoomState, isConnected, on, setRoom])

  useEffect(() => {
    if (!gameStarted || gameEnded || !room?.puzzle || !playerId || game.board.length === 0) return

    if (progressSyncRef.current) {
      clearTimeout(progressSyncRef.current)
    }

    progressSyncRef.current = setTimeout(async () => {
      await fetch(`/sudoku/api/rooms/${roomId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: game.board,
          filledCount: game.filledCount,
          errorCount: game.errorCount,
        }),
      })
    }, 350)

    return () => {
      if (progressSyncRef.current) {
        clearTimeout(progressSyncRef.current)
      }
    }
  }, [game.board, game.errorCount, game.filledCount, gameEnded, gameStarted, playerId, room?.puzzle, roomId])

  useEffect(() => {
    if (!readyToComplete || gameEnded || completeSentRef.current || !room?.puzzle) return
    completeSentRef.current = true

    const submitComplete = async () => {
      const response = await fetch(`/sudoku/api/rooms/${roomId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: game.board,
          errorCount: game.errorCount,
          filledCount: game.filledCount,
        }),
      })
      const data = await response.json()
      if (response.ok && data.room) {
        hydrateRoomState(data.room as SudokuRoom)
        return
      }
      completeSentRef.current = false
    }

    submitComplete()
  }, [game.board, game.errorCount, game.filledCount, gameEnded, hydrateRoomState, readyToComplete, room?.puzzle, roomId])

  const me = useMemo(() => players.find((player) => player.accountId === playerId), [playerId, players])
  const opponent = useMemo(() => players.find((player) => player.accountId !== playerId), [playerId, players])
  const displayPlayers = useMemo(() => {
    return players.map((player) =>
      player.accountId === playerId
        ? {
            ...player,
            progress: {
              ...player.progress,
              filledCount: game.filledCount,
              errorCount: game.errorCount,
              completedAt: game.completedAt ? new Date(game.completedAt).toISOString() : player.progress.completedAt,
            },
          }
        : player,
    )
  }, [game.completedAt, game.errorCount, game.filledCount, playerId, players])
  const canInteract = gameStarted && !gameEnded && Boolean(room?.puzzle)

  const handleStartGame = async () => {
    await fetch(`/sudoku/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    })
  }

  const handleLeave = async () => {
    const action = gameStarted && !gameEnded ? 'surrender' : 'leave'
    await fetch(`/sudoku/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    router.push('/sudoku/multiplayer')
  }

  const handleUpdateSettings = async (settings: { size?: SudokuSize; difficulty?: SudokuDifficulty }) => {
    await fetch(`/sudoku/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-settings', ...settings }),
    })
  }

  if (access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh" />

  return (
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            离开
          </button>
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800">{room?.roomName || '竞速房间'}</h1>
            <p className="text-xs text-slate-400 mt-1">房间码 {roomId}</p>
          </div>
          <div className="w-[44px]" />
        </div>

        {loading && !room && (
          <div className="text-center text-slate-400 py-12">房间加载中...</div>
        )}

        {error && !room && (
          <div className="rounded-2xl bg-rose-50 text-rose-500 px-4 py-4 text-center">
            {error}
          </div>
        )}

        {room && !gameStarted && (
          <SudokuRoomLobby
            roomId={roomId}
            roomName={room.roomName}
            players={players}
            isHost={Boolean(me?.isHost)}
            size={room.size}
            difficulty={room.difficulty}
            onStart={handleStartGame}
            onLeave={handleLeave}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {room && room.puzzle && (
          <div className={`grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4 sm:gap-5 ${gameStarted ? 'animate-slide-up' : 'hidden'}`}>
            <div className="space-y-4">
              <Card glass className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">
                      {SUDOKU_SIZE_CONFIG[room.puzzle.size].title} · {SUDOKU_DIFFICULTY_LABELS[room.puzzle.difficulty]}
                    </p>
                    <h2 className="text-2xl font-black text-slate-800 mt-1">
                      先完整做完这一题就赢
                    </h2>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isConnected ? '实时同步中' : '连接中'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                    <p className="text-xs text-slate-400">你的用时</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{game.formattedElapsed}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                    <p className="text-xs text-slate-400">你的错误</p>
                    <p className="text-xl font-bold text-rose-500 mt-1">{game.errorCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                    <p className="text-xs text-slate-400">你的进度</p>
                    <p className="text-xl font-bold text-sky-600 mt-1">{game.completionPercent}%</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                <SudokuBoard
                  puzzle={room.puzzle}
                  board={game.board}
                  selectedCell={game.selectedCell}
                  onSelectCell={(row, col) => game.setSelectedCell({ row, col })}
                  mistakeCell={game.mistakeCell}
                  readOnly={!canInteract}
                />
                <SudokuNumberPad
                  values={game.values}
                  onInput={game.inputValue}
                  onClear={game.clearCell}
                  disabled={!canInteract}
                />
              </div>
            </div>

            <div className="space-y-4">
              <RaceStatus
                players={displayPlayers}
                currentPlayerId={playerId}
                puzzle={room.puzzle}
                connected={isConnected}
              />

              <Card glass className="p-5 space-y-3">
                <p className="text-sm text-slate-400">比赛说明</p>
                <p className="text-sm leading-7 text-slate-600">
                  双方做的是同一题。系统只同步进度和错误数，不会把你每一步怎么填告诉对手。
                </p>
                {opponent && (
                  <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500">
                    当前对手：<span className="font-semibold text-slate-800">{opponent.nickname}</span>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      <Modal open={gameEnded} title={room?.winner === playerId ? '你赢了' : '对局结束'}>
        <div className="space-y-4">
          <p className="text-center text-slate-600">
            {winnerNickname ? `本局胜者：${winnerNickname}` : '本局已经结束'}
          </p>
          {surrenderMessage && (
            <div className="rounded-2xl bg-amber-50 text-amber-700 px-4 py-3 text-sm">
              {surrenderMessage}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push('/sudoku')}>
              返回数独首页
            </Button>
            <Button className="flex-1" onClick={() => router.push('/sudoku/multiplayer')}>
              返回房间大厅
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} title="确认离开">
        <div className="space-y-4">
          <p className="text-center text-slate-600">
            {gameStarted && !gameEnded ? '比赛正在进行，离开会直接判负。确定要离开吗？' : '确定要离开这个房间吗？'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowLeaveConfirm(false)}>
              取消
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleLeave}>
              确认离开
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
