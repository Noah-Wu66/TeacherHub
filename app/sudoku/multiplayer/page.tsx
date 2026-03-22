'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import { useSudokuRoom } from '@/hooks/sudoku/useRoom'
import { SUDOKU_DIFFICULTY_LABELS, SUDOKU_SIZE_CONFIG, type SudokuDifficulty, type SudokuRoom, type SudokuSize } from '@/types/sudoku'

const SIZE_OPTIONS: SudokuSize[] = ['4x4', '6x6', '9x9']
const DIFFICULTY_OPTIONS: SudokuDifficulty[] = ['easy', 'normal', 'hard']

function ClassicalCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative bg-[#e8dcc8] border-2 border-stone-800 p-5 sm:p-6 ${className}`}>
      <div className="absolute top-1 left-1 bottom-1 right-1 border border-stone-400 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function ClassicalButton({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) {
  const base = "px-4 py-2 font-bold tracking-widest border-2 transition-all duration-150 relative disabled:opacity-50 disabled:cursor-not-allowed text-center"
  const variants = {
    primary: "bg-red-900 text-[#f4ece1] border-stone-900 hover:bg-red-800 active:translate-y-0.5 shadow-[2px_2px_0_0_#292524] active:shadow-none",
    secondary: "bg-[#d8cbb5] text-stone-900 border-stone-800 hover:bg-[#cbb592] active:translate-y-0.5 shadow-[2px_2px_0_0_#292524] active:shadow-none"
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  )
}

function ClassicalModal({ open, onClose, title, children }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 font-serif">
      <div className="bg-[#f4ece1] border-4 border-stone-800 p-6 sm:p-8 max-w-md w-full relative shadow-[8px_8px_0_0_#292524] animate-pop">
        <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-stone-600 pointer-events-none" />
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-stone-800 z-20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <h3 className="text-2xl font-bold text-stone-900 text-center mb-6 tracking-widest relative z-10">{title}</h3>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}

export default function SudokuMultiplayerPage() {
  const router = useRouter()
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用数独挑战。',
  })
  const { createRoom, joinRoom, fetchRooms, loading, error } = useSudokuRoom()

  const [rooms, setRooms] = useState<SudokuRoom[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [size, setSize] = useState<SudokuSize>('4x4')
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy')

  const loadRooms = useCallback(async () => {
    const nextRooms = await fetchRooms()
    setRooms(nextRooms)
  }, [fetchRooms])

  useEffect(() => {
    if (!access.allowed) return
    loadRooms()
    const timer = setInterval(loadRooms, 5000)
    return () => clearInterval(timer)
  }, [access.allowed, loadRooms])

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!roomName.trim()) return
    const result = await createRoom(roomName.trim(), size, difficulty)
    if (result) {
      router.push(`/sudoku/multiplayer/${result.room.roomId}`)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    const result = await joinRoom(roomId)
    if (result) {
      router.push(`/sudoku/multiplayer/${roomId}`)
    }
  }

  if (access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh bg-[#f4ece1]" />

  return (
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6 bg-[#f4ece1] font-serif bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b-2 border-stone-800 pb-4">
          <Link href="/sudoku" className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-bold tracking-widest min-h-[44px] px-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold text-stone-800 tracking-[0.2em]">双人对战</h1>
          <div className="w-[44px]" />
        </div>

        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-2 gap-4">
            <ClassicalButton onClick={() => setShowCreate(true)}>创建房间</ClassicalButton>
            <ClassicalButton variant="secondary" onClick={() => setShowJoin(true)}>输入房间码</ClassicalButton>
          </div>

          {error && (
            <div className="border-2 border-stone-800 bg-[#e8dcc8] text-red-900 px-4 py-3 font-bold tracking-widest text-center shadow-[2px_2px_0_0_#292524]">
              {error}
            </div>
          )}

          <ClassicalCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-400 pb-4">
              <div>
                <p className="text-sm text-stone-500 tracking-widest">可加入房间</p>
                <h2 className="text-xl font-bold text-stone-800 tracking-widest mt-1">等待中的对战</h2>
              </div>
              <button type="button" onClick={loadRooms} className="text-sm text-stone-600 hover:text-stone-900 font-bold tracking-widest px-2 underline underline-offset-4">
                刷新
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="bg-[#f4ece1] border-2 border-stone-800 px-4 py-12 text-center">
                <p className="text-stone-500 font-bold tracking-widest">暂时没有可加入的房间</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div key={room.roomId} className="bg-[#f4ece1] border-2 border-stone-800 px-5 py-4 flex items-center justify-between gap-3 hover:bg-[#d8cbb5] transition-colors">
                    <div>
                      <p className="font-bold text-stone-900 tracking-widest text-lg">{room.roomName}</p>
                      <p className="text-sm text-stone-600 mt-2 font-bold tracking-widest">
                        {SUDOKU_SIZE_CONFIG[room.size].title} · {SUDOKU_DIFFICULTY_LABELS[room.difficulty]} · 房间码 {room.roomId}
                      </p>
                    </div>
                    <ClassicalButton onClick={() => handleJoinRoom(room.roomId)} disabled={loading}>
                      加入
                    </ClassicalButton>
                  </div>
                ))}
              </div>
            )}
          </ClassicalCard>
        </div>
      </div>

      <ClassicalModal open={showCreate} onClose={() => setShowCreate(false)} title="创建房间">
        <form onSubmit={handleCreateRoom} className="space-y-6">
          <input
            type="text"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="给房间起个名字"
            maxLength={20}
            className="w-full bg-[#e8dcc8] border-2 border-stone-800 px-4 py-3 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-stone-600 text-stone-900 placeholder:text-stone-400"
          />

          <div className="space-y-3">
            <p className="text-sm text-stone-600 font-bold tracking-widest">盘面大小</p>
            <div className="flex gap-3 flex-wrap">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`px-4 py-2 border-2 font-bold tracking-widest transition-all ${
                    size === option
                      ? 'bg-stone-800 text-[#f4ece1] border-stone-900 shadow-[2px_2px_0_0_#292524]'
                      : 'bg-[#d8cbb5] text-stone-800 border-stone-800 hover:bg-[#cbb592]'
                  }`}
                >
                  {SUDOKU_SIZE_CONFIG[option].title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-stone-600 font-bold tracking-widest">题目难度</p>
            <div className="flex gap-3 flex-wrap">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDifficulty(option)}
                  className={`px-4 py-2 border-2 font-bold tracking-widest transition-all ${
                    difficulty === option
                      ? 'bg-amber-800 text-[#f4ece1] border-stone-900 shadow-[2px_2px_0_0_#292524]'
                      : 'bg-[#d8cbb5] text-stone-800 border-stone-800 hover:bg-[#cbb592]'
                  }`}
                >
                  {SUDOKU_DIFFICULTY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <ClassicalButton type="submit" className="w-full" disabled={!roomName.trim() || loading}>
            {loading ? '创建中...' : '创建房间'}
          </ClassicalButton>
        </form>
      </ClassicalModal>

      <ClassicalModal open={showJoin} onClose={() => setShowJoin(false)} title="输入房间码">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const roomId = joinRoomId.trim().toUpperCase()
            if (!roomId) return
            handleJoinRoom(roomId)
          }}
          className="space-y-6"
        >
          <input
            type="text"
            value={joinRoomId}
            onChange={(event) => setJoinRoomId(event.target.value.toUpperCase())}
            placeholder="输入 6 位房间码"
            maxLength={6}
            className="w-full bg-[#e8dcc8] border-2 border-stone-800 px-4 py-4 text-center text-xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-stone-600 text-stone-900 placeholder:text-stone-400 uppercase"
          />
          <ClassicalButton type="submit" className="w-full" disabled={joinRoomId.trim().length !== 6 || loading}>
            {loading ? '加入中...' : '加入房间'}
          </ClassicalButton>
        </form>
      </ClassicalModal>
    </div>
  )
}
