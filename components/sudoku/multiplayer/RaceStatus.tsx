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
    <div className="bg-[#e8dcc8] border-2 border-stone-800 p-5 space-y-4 font-serif relative">
      <div className="absolute top-1 left-1 bottom-1 right-1 border border-stone-400 pointer-events-none" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-400 pb-3">
          <div>
            <p className="text-sm text-stone-500 tracking-widest">对局态势</p>
            <h3 className="text-xl font-bold text-stone-800 tracking-widest mt-1">同门争锋</h3>
          </div>
          <span className={`text-xs px-3 py-1 font-bold border-2 ${connected ? 'border-amber-700 text-amber-900 bg-amber-100' : 'border-red-800 text-red-900 bg-red-100'}`}>
            {connected ? '气息已通' : '灵犀断绝'}
          </span>
        </div>

        <div className="space-y-4">
          {players.map((player) => {
            const percent = Math.round((player.progress.filledCount / totalCells) * 100)
            const isMe = player.accountId === currentPlayerId

            return (
              <div key={player.id} className={`border-2 p-4 ${isMe ? 'border-red-900 bg-[#d8cbb5]' : 'border-stone-800 bg-[#f4ece1]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-stone-900 tracking-widest">{player.nickname}{isMe ? '（吾）' : ''}</p>
                    <p className="text-xs text-stone-600 mt-1 font-bold">
                      落子 {player.progress.filledCount}/{totalCells} · 纰漏 {player.progress.errorCount} 次
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 font-bold border-2 ${player.progress.completedAt ? 'border-amber-700 text-amber-900 bg-amber-100' : 'border-stone-500 text-stone-700 bg-[#e8dcc8]'}`}>
                    {player.progress.completedAt ? '破局' : '局中'}
                  </span>
                </div>
                <div className="mt-4 h-2 border border-stone-800 bg-[#e8dcc8]">
                  <div
                    className={`h-full border-r border-stone-800 ${isMe ? 'bg-red-900' : 'bg-stone-800'}`}
                    style={{ width: `${Math.max(2, percent)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
