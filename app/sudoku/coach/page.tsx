'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/24-point/ui/Button'
import Card from '@/components/24-point/ui/Card'
import Modal from '@/components/24-point/ui/Modal'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import SudokuBoard from '@/components/sudoku/SudokuBoard'
import SudokuHintCard from '@/components/sudoku/SudokuHintCard'
import SudokuNumberPad from '@/components/sudoku/SudokuNumberPad'
import { useSudokuGame } from '@/hooks/sudoku/useSudokuGame'
import { getSudokuPuzzlesBySizeAndDifficulty } from '@/lib/sudoku/puzzles'
import { SUDOKU_DIFFICULTY_LABELS, SUDOKU_SIZE_CONFIG, type SudokuDifficulty, type SudokuSize } from '@/types/sudoku'

const SIZE_OPTIONS: SudokuSize[] = ['4x4', '6x6', '9x9']
const DIFFICULTY_OPTIONS: SudokuDifficulty[] = ['easy', 'normal', 'hard']

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
  if (!access.allowed) return <div className="min-h-dvh" />
  if (!puzzle) return null

  return (
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link href="/sudoku" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">教学陪练</h1>
          <div className="w-[44px]" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4 sm:gap-5">
          <Card glass className="p-5 sm:p-6 space-y-5 animate-slide-up">
            <div>
              <p className="text-sm text-slate-400">教学设置</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">先看哪里，再看能填什么</h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-slate-500">盘面规格</p>
                <div className="flex gap-2 flex-wrap">
                  {SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-2xl px-4 py-3 border transition-colors ${
                        selectedSize === size
                          ? 'bg-sky-500 text-white border-sky-500'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {SUDOKU_SIZE_CONFIG[size].title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500">提示难度</p>
                <div className="flex gap-2 flex-wrap">
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className={`rounded-2xl px-4 py-3 border transition-colors ${
                        selectedDifficulty === difficulty
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {SUDOKU_DIFFICULTY_LABELS[difficulty]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <SudokuHintCard
              hint={game.hint}
              onRequestHint={game.requestHint}
              onApplyAnswer={game.applyHintAnswer}
            />
          </Card>

          <div className="space-y-4 animate-slide-up">
            <Card glass className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{puzzle.title}</p>
                  <h2 className="text-2xl font-black text-slate-800 mt-1">
                    {SUDOKU_SIZE_CONFIG[puzzle.size].title} · {SUDOKU_DIFFICULTY_LABELS[puzzle.difficulty]}
                  </h2>
                </div>
                <Button variant="secondary" size="sm" onClick={() => game.loadPuzzle(puzzle)}>
                  重开当前题
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                  <p className="text-xs text-slate-400">计时</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{game.formattedElapsed}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                  <p className="text-xs text-slate-400">错误</p>
                  <p className="text-xl font-bold text-rose-500 mt-1">{game.errorCount}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                  <p className="text-xs text-slate-400">进度</p>
                  <p className="text-xl font-bold text-sky-600 mt-1">{game.completionPercent}%</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
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

      <Modal open={game.completed} title="陪练完成">
        <div className="space-y-4">
          <p className="text-center text-slate-600">
            这题已经顺利完成，可以换一个盘面继续练。
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => game.loadPuzzle(puzzle)}>
              再练一遍
            </Button>
            <Button className="flex-1" onClick={() => setSelectedDifficulty((prev) => prev === 'easy' ? 'normal' : prev === 'normal' ? 'hard' : 'easy')}>
              换个难度
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
