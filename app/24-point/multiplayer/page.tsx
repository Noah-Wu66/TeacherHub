'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/24-point/ui/Card'
import Button from '@/components/24-point/ui/Button'
import Modal from '@/components/24-point/ui/Modal'
import NicknameInput from '@/components/24-point/ui/NicknameInput'
import { useNickname } from '@/hooks/24-point/useNickname'
import { useRoom } from '@/hooks/24-point/useRoom'
import type { Room } from '@/types/24-point'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

export default function MultiplayerPage() {
  const router = useRouter()
  const { nickname, setNickname, hasNickname, isReady } = useNickname()
  const { createRoom, joinRoom, fetchRooms, loading, error } = useRoom()
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用 24 点挑战。',
  })

  const [rooms, setRooms] = useState<Room[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [createTotalRounds, setCreateTotalRounds] = useState(5)
  const [createTimePerRound, setCreateTimePerRound] = useState(60)

  // 加载房间列表
  const loadRooms = useCallback(async () => {
    const data = await fetchRooms()
    setRooms(data)
  }, [fetchRooms])

  useEffect(() => {
    if (isReady && hasNickname) {
      loadRooms()
      const interval = setInterval(loadRooms, 5000)
      return () => clearInterval(interval)
    }
  }, [isReady, hasNickname, loadRooms])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return

    const result = await createRoom(roomName.trim(), nickname, createTotalRounds, createTimePerRound)
    if (result) {
      router.push(`/24-point/multiplayer/${result.room.roomId}`)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    const result = await joinRoom(roomId, nickname)
    if (result) {
      router.push(`/24-point/multiplayer/${roomId}`)
    }
  }

  const handleJoinById = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = joinRoomId.trim().toUpperCase()
    if (!id) return
    await handleJoinRoom(id)
  }

  if (!isReady || access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh" />

  return (
    <div className="min-h-dvh flex flex-col items-center px-3 sm:px-4 py-2 sm:py-6">
      <NicknameInput open={!hasNickname} onSubmit={setNickname} />

      {/* 顶部导航 */}
      <div className="w-full max-w-lg md:max-w-xl flex items-center justify-between mb-3 sm:mb-6">
        <Link
          href="/24-point"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors min-h-[44px] min-w-[44px] px-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-700">多人联机</h1>
        <div className="w-[44px]" />
      </div>

      <div className="w-full max-w-lg md:max-w-xl space-y-6 animate-slide-up">
        {/* 操作区 */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowCreate(true)}
            className="w-full"
          >
            创建房间
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowJoin(true)}
            className="w-full"
          >
            输入房间码
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-center text-sm text-rose-500 bg-rose-50 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {/* 房间列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500">可加入的房间</h2>
            <button
              onClick={loadRooms}
              className="text-sm text-indigo-400 hover:text-indigo-500 active:text-indigo-600 transition-colors cursor-pointer min-h-[44px] px-2 flex items-center"
            >
              刷新
            </button>
          </div>

          {rooms.length === 0 ? (
            <Card glass className="p-8 text-center">
              <p className="text-gray-300 text-sm">暂无可加入的房间</p>
              <p className="text-gray-300 text-xs mt-1">创建一个或输入房间码加入</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <Card key={room.roomId} glass padding="none" className="group hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold text-gray-700">{room.roomName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {room.players[0]?.nickname} 创建 · {room.totalRounds}轮 · {room.timePerRound}秒 · {room.roomId}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinRoom(room.roomId)}
                      disabled={loading}
                    >
                      加入
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 创建房间弹窗 */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="创建房间">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="输入房间名称"
            maxLength={20}
            autoFocus
            className="
              w-full px-4 py-3 rounded-xl
              bg-gray-50 border border-gray-200
              text-gray-800 text-center text-lg font-medium
              placeholder:text-gray-300
              focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent
              transition-all duration-200
            "
          />

          {/* 轮数选择 */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">比赛轮数</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 3, 5, 7, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCreateTotalRounds(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[36px] ${
                    createTotalRounds === n
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n}轮
                </button>
              ))}
            </div>
          </div>

          {/* 时间选择 */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">每轮时间</label>
            <div className="flex gap-2 flex-wrap">
              {[30, 45, 60, 90, 120].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCreateTimePerRound(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[36px] ${
                    createTimePerRound === t
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}秒
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!roomName.trim() || loading}>
            {loading ? '创建中...' : '创建房间'}
          </Button>
        </form>
      </Modal>

      {/* 加入房间弹窗 */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="加入房间">
        <form onSubmit={handleJoinById} className="space-y-4">
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            placeholder="输入6位房间码"
            maxLength={6}
            autoFocus
            className="
              w-full px-4 py-3 rounded-xl
              bg-gray-50 border border-gray-200
              text-gray-800 text-center text-xl sm:text-2xl font-mono font-bold tracking-[0.15em] sm:tracking-[0.3em]
              placeholder:text-gray-300 placeholder:text-lg placeholder:tracking-normal placeholder:font-normal
              focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent
              transition-all duration-200
            "
          />
          <Button type="submit" className="w-full" disabled={joinRoomId.trim().length !== 6 || loading}>
            {loading ? '加入中...' : '加入'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
