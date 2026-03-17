'use client'

import type { SudokuPlayer, SudokuPuzzle } from '@/types/sudoku'

interface RaceStatusProps {
  players: SudokuPlayer[]
  currentPlayerId: string
  puzzle: SudokuPuzzle
  connected: boolean
}

export default function RaceStatus({
  players,
  currentPlayerId,
  puzzle,
  connected,
}: RaceStatusProps) {
  const totalCells = puzzle.solution.length * puzzle.solution.length

  return (
    <div className="rounded-[28px] bg-white/78 border border-white/60 shadow-xl shadow-sky-100/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">竞速状态</p>
          <h3 className="text-xl font-bold text-slate-800">双人进度</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {connected ? '已连接' : '重连中'}
        </span>
      </div>

      <div className="space-y-3">
        {players.map((player) => {
          const percent = Math.round((player.progress.filledCount / totalCells) * 100)
          const isMe = player.accountId === currentPlayerId

          return (
            <div key={player.id} className={`rounded-2xl border p-4 ${isMe ? 'border-sky-200 bg-sky-50/70' : 'border-slate-200 bg-slate-50/70'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{player.nickname}{isMe ? '（你）' : ''}</p>
                  <p className="text-xs text-slate-400">
                    已填 {player.progress.filledCount}/{totalCells} · 错误 {player.progress.errorCount} 次
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${player.progress.completedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 border border-slate-200'}`}>
                  {player.progress.completedAt ? '已完成' : '进行中'}
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${isMe ? 'bg-sky-500' : 'bg-violet-500'}`}
                  style={{ width: `${Math.max(6, percent)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
