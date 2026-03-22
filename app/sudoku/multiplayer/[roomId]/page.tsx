'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

function ClassicalCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative bg-[#e8dcc8] border-2 border-stone-800 p-5 sm:p-6 ${className}`}>
      <div className="absolute top-1 left-1 bottom-1 right-1 border border-stone-400 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function ClassicalButton({ children, onClick, variant = 'primary', className = '', disabled = false }: any) {
  const base = "px-4 py-2 font-bold tracking-widest border-2 transition-all duration-150 relative disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    primary: "bg-red-900 text-[#f4ece1] border-stone-900 hover:bg-red-800 active:translate-y-0.5 shadow-[2px_2px_0_0_#292524] active:shadow-none",
    secondary: "bg-[#d8cbb5] text-stone-900 border-stone-800 hover:bg-[#cbb592] active:translate-y-0.5 shadow-[2px_2px_0_0_#292524] active:shadow-none",
    danger: "bg-stone-900 text-[#f4ece1] border-stone-900 hover:bg-stone-800 active:translate-y-0.5 shadow-[2px_2px_0_0_#292524] active:shadow-none"
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  )
}

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
  if (!access.allowed) return <div className="min-h-dvh bg-[#f4ece1]" />

  return (
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6 bg-[#f4ece1] font-serif bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b-2 border-stone-800 pb-4">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-bold tracking-widest min-h-[44px] px-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            离开
          </button>
          <div className="text-center">
            <h1 className="text-xl sm:text-3xl font-bold text-stone-800 tracking-[0.2em]">{room?.roomName || '对战房间'}</h1>
            <p className="text-sm text-stone-600 font-bold mt-2 tracking-widest">房间码：{roomId}</p>
          </div>
          <div className="w-[44px]" />
        </div>

        {loading && !room && (
          <div className="text-center text-stone-600 py-12 font-bold tracking-widest text-lg animate-pulse">
            加载房间中...
          </div>
        )}

        {error && !room && (
          <div className="border-4 border-stone-800 bg-[#e8dcc8] p-6 text-center shadow-[8px_8px_0_0_#292524] relative">
            <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-stone-600 pointer-events-none" />
            <p className="font-bold text-red-900 tracking-widest relative z-10 text-lg">
              {error}
            </p>
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
          <div className={`grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 ${gameStarted ? 'animate-slide-up' : 'hidden'}`}>
            <div className="space-y-6">
              <ClassicalCard>
                <div className="flex items-start justify-between gap-3 border-b border-stone-400 pb-4">
                  <div>
                    <p className="text-sm text-stone-500 tracking-widest">
                      {SUDOKU_SIZE_CONFIG[room.puzzle.size].title} · {SUDOKU_DIFFICULTY_LABELS[room.puzzle.difficulty]}
                    </p>
                    <h2 className="text-2xl font-bold text-stone-800 mt-2 tracking-widest">
                      步步为营 · 争分夺秒
                    </h2>
                  </div>
                  <span className={`text-xs px-3 py-1 font-bold border-2 mt-2 ${isConnected ? 'border-amber-700 text-amber-900 bg-amber-100' : 'border-red-800 text-red-900 bg-red-100'}`}>
                    {isConnected ? '已连接' : '连接中'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: '耗时', value: game.formattedElapsed, color: 'text-stone-800' },
                    { label: '纰漏', value: game.errorCount, color: 'text-red-800' },
                    { label: '进度', value: `${game.completionPercent}%`, color: 'text-stone-800' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#f4ece1] px-4 py-3 border-2 border-stone-800 text-center">
                      <p className="text-xs text-stone-500 tracking-widest">{stat.label}</p>
                      <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </ClassicalCard>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
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

            <div className="space-y-6">
              <RaceStatus
                players={displayPlayers}
                currentPlayerId={playerId}
                puzzle={room.puzzle}
                connected={isConnected}
              />

              <ClassicalCard className="space-y-4">
                <p className="text-sm text-stone-500 tracking-widest font-bold">比赛说明</p>
                <p className="text-sm leading-relaxed text-stone-600 font-bold tracking-widest">
                  双方做同一题，只同步进度和错误数，不会互相透露每一步的填法。
                </p>
                {opponent && (
                  <div className="border-2 border-stone-800 bg-[#f4ece1] px-4 py-3 text-sm text-stone-600 font-bold tracking-widest">
                    对手：<span className="text-stone-900 text-lg">{opponent.nickname}</span>
                  </div>
                )}
              </ClassicalCard>
            </div>
          </div>
        )}
      </div>

      {gameEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#f4ece1] border-4 border-stone-800 p-8 max-w-sm w-full relative shadow-[8px_8px_0_0_#292524] animate-pop">
            <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-stone-600 pointer-events-none" />
            <h3 className="text-3xl font-bold text-stone-900 text-center mb-6 tracking-[0.3em] relative z-10">
              {room?.winner === playerId ? '你赢了' : '对局结束'}
            </h3>
            
            <div className="space-y-6 relative z-10">
              <p className="text-center text-stone-700 tracking-widest font-bold text-lg">
                {winnerNickname ? `本局胜者：${winnerNickname}` : '本局已经结束'}
              </p>
              {surrenderMessage && (
                <div className="border-2 border-stone-800 bg-[#e8dcc8] text-stone-800 px-4 py-3 text-sm font-bold tracking-widest text-center">
                  {surrenderMessage}
                </div>
              )}
              <div className="flex gap-4 mt-8">
                <ClassicalButton variant="secondary" className="flex-1" onClick={() => router.push('/sudoku')}>
                  返回首页
                </ClassicalButton>
                <ClassicalButton className="flex-1" onClick={() => router.push('/sudoku/multiplayer')}>
                  返回大厅
                </ClassicalButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#f4ece1] border-4 border-stone-800 p-8 max-w-sm w-full relative shadow-[8px_8px_0_0_#292524] animate-pop">
            <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-stone-600 pointer-events-none" />
            <h3 className="text-2xl font-bold text-stone-900 text-center mb-6 tracking-widest relative z-10">
              确认离开
            </h3>
            
            <div className="space-y-6 relative z-10">
              <p className="text-center text-stone-700 tracking-widest font-bold leading-relaxed">
                {gameStarted && !gameEnded ? '比赛正在进行，离开会直接判负。确定要离开吗？' : '确定要离开这个房间吗？'}
              </p>
              <div className="flex gap-4 mt-8">
                <ClassicalButton variant="secondary" className="flex-1" onClick={() => setShowLeaveConfirm(false)}>
                  取消
                </ClassicalButton>
                <ClassicalButton variant="danger" className="flex-1" onClick={handleLeave}>
                  离开
                </ClassicalButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
