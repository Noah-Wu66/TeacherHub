'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import SudokuBoard from '@/components/sudoku/SudokuBoard'
import SudokuHintCard from '@/components/sudoku/SudokuHintCard'
import SudokuNumberPad from '@/components/sudoku/SudokuNumberPad'
import { useSudokuGame } from '@/hooks/sudoku/useSudokuGame'
import { getSudokuPuzzlesBySizeAndDifficulty } from '@/lib/sudoku/puzzles'
import { SUDOKU_DIFFICULTY_LABELS, SUDOKU_SIZE_CONFIG, type SudokuDifficulty, type SudokuSize } from '@/types/sudoku'

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

export default function SudokuCoachPage() {
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用数独挑战。',
  })
  const game = useSudokuGame()
  const [selectedSize, setSelectedSize] = useState<SudokuSize>('4x4')
  const [selectedDifficulty, setSelectedDifficulty] = useState<SudokuDifficulty>('easy')

  const puzzle = useMemo(() => {
    return getSudokuPuzzlesBySizeAndDifficulty(selectedSize, selectedDifficulty)[0]
  }, [selectedDifficulty, selectedSize])

  useEffect(() => {
    if (!puzzle) return
    game.loadPuzzle(puzzle)
  }, [game.loadPuzzle, puzzle])

  if (access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh bg-[#f4ece1]" />
  if (!puzzle) return null

  return (
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6 bg-[#f4ece1] font-serif bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b-2 border-stone-800 pb-4">
          <Link href="/sudoku" className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-bold tracking-widest min-h-[44px] px-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            归途
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold text-stone-800 tracking-[0.2em]">名师指点</h1>
          <div className="w-[44px]" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="space-y-6">
            <ClassicalCard>
              <div className="border-b border-stone-400 pb-4 mb-5">
                <p className="text-sm text-stone-500 tracking-widest">拜师学艺</p>
                <h2 className="text-2xl font-bold text-stone-800 mt-2 tracking-widest">观微知著 · 算筹定音</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-stone-600 tracking-widest">棋局规制</p>
                  <div className="flex gap-3 flex-wrap">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border-2 font-bold tracking-widest transition-all ${
                          selectedSize === size
                            ? 'bg-stone-800 text-[#f4ece1] border-stone-900 shadow-[2px_2px_0_0_#292524]'
                            : 'bg-[#d8cbb5] text-stone-800 border-stone-800 hover:bg-[#cbb592]'
                        }`}
                      >
                        {SUDOKU_SIZE_CONFIG[size].title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-stone-600 tracking-widest">深浅层次</p>
                  <div className="flex gap-3 flex-wrap">
                    {DIFFICULTY_OPTIONS.map((difficulty) => (
                      <button
                        key={difficulty}
                        type="button"
                        onClick={() => setSelectedDifficulty(difficulty)}
                        className={`px-4 py-2 border-2 font-bold tracking-widest transition-all ${
                          selectedDifficulty === difficulty
                            ? 'bg-amber-800 text-[#f4ece1] border-stone-900 shadow-[2px_2px_0_0_#292524]'
                            : 'bg-[#d8cbb5] text-stone-800 border-stone-800 hover:bg-[#cbb592]'
                        }`}
                      >
                        {SUDOKU_DIFFICULTY_LABELS[difficulty]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ClassicalCard>

            <SudokuHintCard
              hint={game.hint}
              onRequestHint={game.requestHint}
              onApplyAnswer={game.applyHintAnswer}
            />
          </div>

          <div className="space-y-6">
            <ClassicalCard>
              <div className="flex items-start justify-between gap-3 border-b border-stone-400 pb-4">
                <div>
                  <p className="text-sm text-stone-500 tracking-widest">{puzzle.title}</p>
                  <h2 className="text-2xl font-bold text-stone-800 mt-2 tracking-widest">
                    {SUDOKU_SIZE_CONFIG[puzzle.size].title} · {SUDOKU_DIFFICULTY_LABELS[puzzle.difficulty]}
                  </h2>
                </div>
                <ClassicalButton variant="secondary" onClick={() => game.loadPuzzle(puzzle)}>
                  重起炉灶
                </ClassicalButton>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  { label: '光阴', value: game.formattedElapsed, color: 'text-stone-800' },
                  { label: '纰漏', value: game.errorCount, color: 'text-red-800' },
                  { label: '造化', value: `${game.completionPercent}%`, color: 'text-stone-800' }
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
                puzzle={puzzle}
                board={game.board}
                selectedCell={game.selectedCell}
                onSelectCell={(row, col) => game.setSelectedCell({ row, col })}
                mistakeCell={game.mistakeCell}
                hint={game.hint}
              />
              <SudokuNumberPad
                values={game.values}
                onInput={game.inputValue}
                onClear={game.clearCell}
              />
            </div>
          </div>
        </div>
      </div>

      {game.completed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#f4ece1] border-4 border-stone-800 p-8 max-w-sm w-full relative shadow-[8px_8px_0_0_#292524] animate-pop">
            <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-stone-600 pointer-events-none" />
            <h3 className="text-3xl font-bold text-stone-900 text-center mb-6 tracking-[0.3em] relative z-10">指点功成</h3>
            
            <div className="space-y-6 relative z-10">
              <p className="text-center text-stone-700 tracking-widest font-bold leading-relaxed">
                此局已破，阁下可谓获益良多。<br />可更易盘面，再求精进。
              </p>
              
              <div className="flex gap-3 mt-8">
                <ClassicalButton variant="secondary" className="flex-1" onClick={() => game.loadPuzzle(puzzle)}>
                  再练一遍
                </ClassicalButton>
                <ClassicalButton className="flex-1" onClick={() => setSelectedDifficulty((prev) => prev === 'easy' ? 'normal' : prev === 'normal' ? 'hard' : 'easy')}>
                  变幻难度
                </ClassicalButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
