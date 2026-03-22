'use client'

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

function ClassicalButton({ children, onClick, variant = 'primary', className = '', disabled = false }: any) {
  const base = "px-4 py-2 font-bold tracking-widest border-2 transition-all duration-150 relative disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    primary: "bg-red-900 text-[#f4ece1] border-stone-900 hover:bg-red-800 active:translate-y-0.5 shadow-[2px_2px_0_0_#292524] active:shadow-none",
    secondary: "bg-[#d8cbb5] text-stone-900 border-stone-800 hover:bg-[#cbb592] active:translate-y-0.5 shadow-[2px_2px_0_0_#292524] active:shadow-none"
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  )
}

function ClassicalCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative bg-[#e8dcc8] border-2 border-stone-800 p-6 sm:p-7 ${className}`}>
      <div className="absolute top-1 left-1 bottom-1 right-1 border border-stone-400 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

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
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 animate-slide-up font-serif">
      <ClassicalCard className="space-y-6">
        <div className="text-center space-y-3 border-b border-stone-400 pb-5">
          <p className="text-sm text-stone-500 tracking-widest">对弈雅间</p>
          <h2 className="text-2xl font-bold text-stone-800 tracking-widest">{roomName}</h2>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="inline-flex items-center gap-3 bg-[#f4ece1] px-6 py-3 text-xl sm:text-2xl font-bold tracking-[0.2em] text-stone-900 border-2 border-stone-800 hover:bg-[#d8cbb5] transition-colors"
          >
            <span>室号：</span>
            <span className="text-red-900">{roomId}</span>
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-stone-600 font-bold tracking-widest">雅间同道（{players.length}/2）</p>
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between border-2 border-stone-800 bg-[#f4ece1] px-4 py-3">
              <div>
                <p className="font-bold text-stone-900 tracking-widest">{player.nickname}</p>
                <p className="text-xs text-stone-500 mt-1 font-bold">{player.isHost ? '主客' : '同道'}</p>
              </div>
              <span className={`text-xs px-2 py-1 font-bold border-2 ${player.connected ? 'border-amber-700 text-amber-900 bg-amber-100' : 'border-stone-400 text-stone-500 bg-stone-200'}`}>
                {player.connected ? '已入座' : '未现身'}
              </span>
            </div>
          ))}

          {players.length < 2 && (
            <div className="border-2 border-dashed border-stone-400 bg-[#f4ece1]/50 px-4 py-5 text-center text-stone-500 font-bold tracking-widest">
              静候另一位同道赴约
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-2">
          <ClassicalButton variant="secondary" className="flex-1" onClick={onLeave}>
            拂袖而去
          </ClassicalButton>
          {isHost && (
            <ClassicalButton className="flex-1" onClick={onStart} disabled={!canStart}>
              {canStart ? '设局开盘' : '等待同道'}
            </ClassicalButton>
          )}
        </div>
      </ClassicalCard>

      <ClassicalCard className="space-y-6">
        <div className="border-b border-stone-400 pb-5">
          <p className="text-sm text-stone-500 tracking-widest">棋局章法</p>
          <h3 className="text-xl font-bold text-stone-800 tracking-widest mt-2">规制与深浅</h3>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm text-stone-600 font-bold tracking-widest">棋盘规制</p>
            <div className="flex gap-3 flex-wrap">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ size: option })}
                  className={`px-4 py-2 border-2 font-bold tracking-widest transition-all ${
                    size === option
                      ? 'bg-stone-800 text-[#f4ece1] border-stone-900 shadow-[2px_2px_0_0_#292524]'
                      : 'bg-[#d8cbb5] text-stone-800 border-stone-800 hover:bg-[#cbb592]'
                  } ${!isHost ? 'opacity-70 cursor-default' : ''}`}
                >
                  {SUDOKU_SIZE_CONFIG[option].title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-stone-600 font-bold tracking-widest">题目深浅</p>
            <div className="flex gap-3 flex-wrap">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ difficulty: option })}
                  className={`px-4 py-2 border-2 font-bold tracking-widest transition-all ${
                    difficulty === option
                      ? 'bg-amber-800 text-[#f4ece1] border-stone-900 shadow-[2px_2px_0_0_#292524]'
                      : 'bg-[#d8cbb5] text-stone-800 border-stone-800 hover:bg-[#cbb592]'
                  } ${!isHost ? 'opacity-70 cursor-default' : ''}`}
                >
                  {SUDOKU_DIFFICULTY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isHost && (
          <div className="border-2 border-stone-800 bg-[#f4ece1] px-4 py-3 text-sm text-stone-600 font-bold tracking-widest leading-relaxed">
            客随主便，规制由主客定夺。双方将解同一残局。
          </div>
        )}
      </ClassicalCard>
    </div>
  )
}
