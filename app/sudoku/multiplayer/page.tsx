'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/24-point/ui/Button'
import Card from '@/components/24-point/ui/Card'
import Modal from '@/components/24-point/ui/Modal'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import { useSudokuRoom } from '@/hooks/sudoku/useRoom'
import { SUDOKU_DIFFICULTY_LABELS, SUDOKU_SIZE_CONFIG, type SudokuDifficulty, type SudokuRoom, type SudokuSize } from '@/types/sudoku'

const SIZE_OPTIONS: SudokuSize[] = ['4x4', '6x6', '9x9']
const DIFFICULTY_OPTIONS: SudokuDifficulty[] = ['easy', 'normal', 'hard']

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
  if (!access.allowed) return <div className="min-h-dvh" />

  return (
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link href="/sudoku" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">双人竞速</h1>
          <div className="w-[44px]" />
        </div>

        <div className="space-y-5 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setShowCreate(true)}>创建房间</Button>
            <Button variant="secondary" onClick={() => setShowJoin(true)}>输入房间码</Button>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 text-rose-500 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <Card glass className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">可加入房间</p>
                <h2 className="text-xl font-bold text-slate-800">等待中的竞速房</h2>
              </div>
              <button type="button" onClick={loadRooms} className="text-sm text-sky-500 hover:text-sky-600 min-h-[44px] px-2">
                刷新
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="rounded-2xl bg-white px-4 py-10 text-center border border-slate-200">
                <p className="text-slate-400">暂时没有可加入的房间</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div key={room.roomId} className="rounded-2xl bg-white border border-slate-200 px-4 py-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{room.roomName}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {SUDOKU_SIZE_CONFIG[room.size].title} · {SUDOKU_DIFFICULTY_LABELS[room.difficulty]} · 房间码 {room.roomId}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleJoinRoom(room.roomId)} disabled={loading}>
                      加入
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="创建竞速房间">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <input
            type="text"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="给房间起个名字"
            maxLength={20}
            className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
          />

          <div className="space-y-2">
            <p className="text-sm text-slate-500">盘面规格</p>
            <div className="flex gap-2 flex-wrap">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`rounded-xl px-3 py-2 border ${size === option ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {SUDOKU_SIZE_CONFIG[option].title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-500">题目难度</p>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDifficulty(option)}
                  className={`rounded-xl px-3 py-2 border ${difficulty === option ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {SUDOKU_DIFFICULTY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!roomName.trim() || loading}>
            {loading ? '创建中...' : '创建房间'}
          </Button>
        </form>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="输入房间码">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const roomId = joinRoomId.trim().toUpperCase()
            if (!roomId) return
            handleJoinRoom(roomId)
          }}
          className="space-y-4"
        >
          <input
            type="text"
            value={joinRoomId}
            onChange={(event) => setJoinRoomId(event.target.value.toUpperCase())}
            placeholder="输入 6 位房间码"
            maxLength={6}
            className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center text-xl font-mono tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <Button type="submit" className="w-full" disabled={joinRoomId.trim().length !== 6 || loading}>
            {loading ? '加入中...' : '加入房间'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
