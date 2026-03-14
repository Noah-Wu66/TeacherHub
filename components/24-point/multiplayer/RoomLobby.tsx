'use client'

import { useState } from 'react'
import Card from '@/components/24-point/ui/Card'
import Button from '@/components/24-point/ui/Button'
import Modal from '@/components/24-point/ui/Modal'
import type { Player, PlayerRole } from '@/types/24-point'

interface RoomLobbyProps {
  roomId: string
  roomName: string
  players: Player[]
  isHost: boolean
  totalRounds: number
  timePerRound: number
  onStart: () => void
  onLeave: () => void
  onSetRole: (targetPlayerId: string, role: PlayerRole) => void
  onUpdateSettings: (settings: { totalRounds?: number; timePerRound?: number }) => void
}

const ROUND_OPTIONS = [1, 3, 5, 7, 10]
const TIME_OPTIONS = [30, 45, 60, 90, 120]

export default function RoomLobby({
  roomId,
  roomName,
  players,
  isHost,
  totalRounds,
  timePerRound,
  onStart,
  onLeave,
  onSetRole,
  onUpdateSettings,
}: RoomLobbyProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const activePlayers = players.filter((p) => p.role === 'player')
  const canStart = activePlayers.length >= 2 && isHost

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId)
  }

  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto space-y-4 animate-slide-up">
      <Card glass className="p-6 md:p-8 text-center space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-700">{roomName}</h2>

        {/* 房间码 */}
        <div className="space-y-1">
          <p className="text-sm text-gray-400">房间码</p>
          <button
            onClick={handleCopyRoomId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-2xl md:text-3xl font-mono font-bold text-indigo-500 tracking-widest hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {roomId}
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <p className="text-xs text-gray-300">点击复制，分享给好友</p>
        </div>

        {/* 玩家列表 */}
        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            房间成员 ({players.length}) · 参赛 {activePlayers.length}
          </p>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                  player.role === 'observer' ? 'bg-gray-50/60 opacity-70' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold flex-shrink-0 ${
                    player.isHost
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : player.role === 'observer'
                        ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                        : 'bg-gradient-to-br from-indigo-400 to-purple-500'
                  }`}>
                    {player.role === 'observer' ? '👁' : player.nickname[0]}
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium text-gray-700 block truncate">{player.nickname}</span>
                    {player.role === 'observer' && (
                      <span className="text-xs text-gray-400">观战中</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {player.isHost && (
                    <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                      房主
                    </span>
                  )}
                  {/* 房主可以切换其他人的角色 */}
                  {isHost && !player.isHost && (
                    <button
                      onClick={() => onSetRole(player.id, player.role === 'observer' ? 'player' : 'observer')}
                      className="text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors min-h-[32px] min-w-[48px] flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200"
                    >
                      {player.role === 'observer' ? '参赛' : '观战'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {activePlayers.length < 2 && (
              <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-300">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="ml-2 text-sm">等待更多参赛玩家...</span>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => setShowLeaveConfirm(true)}>
            离开
          </Button>
          {isHost && (
            <Button className="flex-1" onClick={onStart} disabled={!canStart}>
              {canStart ? '开始游戏' : '等待玩家'}
            </Button>
          )}
        </div>
      </Card>

      {/* 房主设置面板 */}
      {isHost && (
        <Card glass className="p-5 md:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 text-center">房间设置</h3>

          {/* 轮数设置 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-500">比赛轮数</label>
            <div className="flex gap-2 flex-wrap">
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => onUpdateSettings({ totalRounds: n })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[36px] ${
                    totalRounds === n
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n}轮
                </button>
              ))}
            </div>
          </div>

          {/* 时间设置 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-500">每轮时间</label>
            <div className="flex gap-2 flex-wrap">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateSettings({ timePerRound: t })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[36px] ${
                    timePerRound === t
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}秒
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 非房主也能看到设置 */}
      {!isHost && (
        <Card glass className="p-4 md:p-5">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>{totalRounds} 轮</span>
            <span className="text-gray-300">·</span>
            <span>每轮 {timePerRound} 秒</span>
          </div>
        </Card>
      )}

      {/* 离开确认弹窗 */}
      <Modal open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} title="确认离开">
        <div className="space-y-4">
          <p className="text-center text-gray-500">确定要离开房间吗？</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowLeaveConfirm(false)}>
              取消
            </Button>
            <Button variant="danger" className="flex-1" onClick={onLeave}>
              确认离开
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
