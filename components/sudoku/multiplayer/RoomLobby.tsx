'use client'

import Card from '@/components/24-point/ui/Card'
import Button from '@/components/24-point/ui/Button'
import type { SudokuDifficulty, SudokuPlayer, SudokuSize } from '@/types/sudoku'
import { SUDOKU_DIFFICULTY_LABELS, SUDOKU_SIZE_CONFIG } from '@/types/sudoku'

interface SudokuRoomLobbyProps {
  roomId: string
  roomName: string
  players: SudokuPlayer[]
  isHost: boolean
  size: SudokuSize
  difficulty: SudokuDifficulty
  onStart: () => void
  onLeave: () => void
  onUpdateSettings: (settings: { size?: SudokuSize; difficulty?: SudokuDifficulty }) => void
}

const SIZE_OPTIONS: SudokuSize[] = ['4x4', '6x6', '9x9']
const DIFFICULTY_OPTIONS: SudokuDifficulty[] = ['easy', 'normal', 'hard']

export default function SudokuRoomLobby({
  roomId,
  roomName,
  players,
  isHost,
  size,
  difficulty,
  onStart,
  onLeave,
  onUpdateSettings,
}: SudokuRoomLobbyProps) {
  const canStart = players.length >= 2 && isHost

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 animate-slide-up">
      <Card glass className="p-6 sm:p-7 space-y-5">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-400">双人竞速房间</p>
          <h2 className="text-2xl font-bold text-slate-800">{roomName}</h2>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xl sm:text-2xl font-mono font-bold tracking-[0.25em] text-sky-600 border border-slate-200"
          >
            {roomId}
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-500">房间成员（{players.length}/2）</p>
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="font-semibold text-slate-800">{player.nickname}</p>
                <p className="text-xs text-slate-400">{player.isHost ? '房主' : '参赛玩家'}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${player.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                {player.connected ? '已在线' : '未连接'}
              </span>
            </div>
          ))}

          {players.length < 2 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 px-4 py-5 text-center text-slate-400">
              等待另一位玩家加入
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onLeave}>
            离开房间
          </Button>
          {isHost && (
            <Button className="flex-1" onClick={onStart} disabled={!canStart}>
              {canStart ? '开始竞速' : '等待对手'}
            </Button>
          )}
        </div>
      </Card>

      <Card glass className="p-6 sm:p-7 space-y-5">
        <div>
          <p className="text-sm text-slate-400">房间设置</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">盘面与难度</h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">盘面规格</p>
            <div className="flex gap-2 flex-wrap">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ size: option })}
                  className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                    size === option
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white text-slate-600 border-slate-200'
                  } ${!isHost ? 'opacity-70 cursor-default' : 'cursor-pointer hover:bg-slate-50'}`}
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
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ difficulty: option })}
                  className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                    difficulty === option
                      ? 'bg-violet-500 text-white border-violet-500'
                      : 'bg-white text-slate-600 border-slate-200'
                  } ${!isHost ? 'opacity-70 cursor-default' : 'cursor-pointer hover:bg-slate-50'}`}
                >
                  {SUDOKU_DIFFICULTY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isHost && (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            当前由房主控制比赛设置，双方会拿到同一题。
          </div>
        )}
      </Card>
    </div>
  )
}
