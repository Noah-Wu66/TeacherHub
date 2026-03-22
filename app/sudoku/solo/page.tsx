'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import SudokuBoard from '@/components/sudoku/SudokuBoard'
import SudokuNumberPad from '@/components/sudoku/SudokuNumberPad'
import { useLocalSudokuProgress } from '@/hooks/sudoku/useLocalProgress'
import { useSudokuGame } from '@/hooks/sudoku/useSudokuGame'
import { getSudokuPuzzlesBySize } from '@/lib/sudoku/puzzles'
import { SUDOKU_DIFFICULTY_LABELS, SUDOKU_SIZE_CONFIG, type SudokuSize } from '@/types/sudoku'

const SIZE_OPTIONS: SudokuSize[] = ['4x4', '6x6', '9x9']

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

export default function SudokuSoloPage() {
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用数独挑战。',
  })
  const progress = useLocalSudokuProgress()
  const game = useSudokuGame()

  const [selectedSize, setSelectedSize] = useState<SudokuSize>('4x4')
  const [selectedPuzzleId, setSelectedPuzzleId] = useState('')
  const winRecordedRef = useRef('')

  const puzzles = useMemo(() => getSudokuPuzzlesBySize(selectedSize), [selectedSize])
  const selectedPuzzle = useMemo(
    () => puzzles.find((item) => item.id === selectedPuzzleId) ?? puzzles[0],
    [puzzles, selectedPuzzleId],
  )

  useEffect(() => {
    if (!progress.isReady || puzzles.length === 0) return
    const firstUnlocked = puzzles.find((item, index) => index === 0 || progress.isCompleted(puzzles[index - 1].id)) ?? puzzles[0]
    setSelectedPuzzleId((prev) => {
      if (prev && puzzles.some((item) => item.id === prev)) {
        return prev
      }
      return firstUnlocked.id
    })
  }, [progress.isReady, progress.isCompleted, puzzles])

  useEffect(() => {
    if (!selectedPuzzle) return
    game.loadPuzzle(selectedPuzzle)
    progress.recordAttempt(selectedPuzzle.id)
    winRecordedRef.current = ''
  }, [game.loadPuzzle, progress.recordAttempt, selectedPuzzle])

  useEffect(() => {
    if (!selectedPuzzle || !game.completed || winRecordedRef.current === selectedPuzzle.id) return
    progress.recordWin(selectedPuzzle.id, game.elapsedSeconds, game.errorCount)
    winRecordedRef.current = selectedPuzzle.id
  }, [game.completed, game.elapsedSeconds, game.errorCount, progress.recordWin, selectedPuzzle])

  if (access.loading || !progress.isReady) return null
  if (!access.allowed) return <div className="min-h-dvh bg-[#f4ece1]" />
  if (!selectedPuzzle) return null

  const currentIndex = puzzles.findIndex((item) => item.id === selectedPuzzle.id)
  const nextPuzzle = currentIndex >= 0 ? puzzles[currentIndex + 1] : null
  const currentRecord = progress.getRecord(selectedPuzzle.id)
  const nextSize: SudokuSize = selectedSize === '4x4' ? '6x6' : selectedSize === '6x6' ? '9x9' : '4x4'

  const restartCurrentPuzzle = () => {
    winRecordedRef.current = ''
    progress.recordAttempt(selectedPuzzle.id)
    game.loadPuzzle(selectedPuzzle)
  }

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
          <h1 className="text-xl sm:text-3xl font-bold text-stone-800 tracking-[0.2em]">独自修行</h1>
          <div className="w-[44px]" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <ClassicalCard className="space-y-6">
            <div className="border-b border-stone-400 pb-4">
              <p className="text-sm text-stone-500 tracking-widest">修行境地</p>
              <h2 className="text-2xl font-bold text-stone-800 mt-2 tracking-widest">循序渐进 · 登峰造极</h2>
            </div>

            <div className="flex gap-3 flex-wrap">
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`relative px-4 py-3 text-left transition-all border-2 ${
                    selectedSize === size
                      ? 'bg-red-900 text-[#f4ece1] border-stone-900 shadow-[2px_2px_0_0_#292524]'
                      : 'bg-[#d8cbb5] text-stone-800 border-stone-800 hover:bg-[#cbb592]'
                  }`}
                >
                  <div className="font-bold tracking-widest">{SUDOKU_SIZE_CONFIG[size].title}</div>
                  <div className={`text-xs mt-1 ${selectedSize === size ? 'text-red-200' : 'text-stone-600'}`}>
                    {SUDOKU_SIZE_CONFIG[size].subtitle}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {puzzles.map((puzzle, index) => {
                const unlocked = index === 0 || progress.isCompleted(puzzles[index - 1].id)
                const completed = progress.isCompleted(puzzle.id)
                const selected = selectedPuzzle.id === puzzle.id
                const record = progress.getRecord(puzzle.id)

                return (
                  <button
                    key={puzzle.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setSelectedPuzzleId(puzzle.id)}
                    className={`w-full border-2 px-4 py-4 text-left transition-all relative ${
                      selected
                        ? 'border-stone-900 bg-[#cbb592] shadow-[4px_4px_0_0_#292524] -translate-y-1'
                        : 'border-stone-800 bg-[#f4ece1]'
                    } ${!unlocked ? 'opacity-50 cursor-not-allowed bg-stone-200' : 'hover:bg-[#e8dcc8]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-stone-900 tracking-widest text-lg">{puzzle.title}</p>
                        <p className="text-sm text-stone-600 mt-1">
                          难度：{SUDOKU_DIFFICULTY_LABELS[puzzle.difficulty]}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 font-bold border-2 ${
                        completed ? 'border-amber-700 text-amber-900 bg-amber-100' : unlocked ? 'border-stone-500 text-stone-700 bg-stone-100' : 'border-stone-300 text-stone-400 bg-stone-100'
                      }`}>
                        {completed ? '已破局' : unlocked ? '可破局' : '未解锁'}
                      </span>
                    </div>
                    {(record.bestSeconds !== null || record.lowestErrors !== null) && (
                      <div className="mt-3 pt-2 border-t border-stone-400/50 text-xs text-stone-600 font-medium">
                        绝佳气力 {record.bestSeconds ?? '-'} 息 · 最少纰漏 {record.lowestErrors ?? '-'} 次
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </ClassicalCard>

          <div className="space-y-6">
            <ClassicalCard>
              <div className="flex items-start justify-between gap-3 border-b border-stone-400 pb-4">
                <div>
                  <p className="text-sm text-stone-500 tracking-widest">
                    {SUDOKU_SIZE_CONFIG[selectedPuzzle.size].title} · {selectedPuzzle.title}
                  </p>
                  <h2 className="text-2xl font-bold text-stone-800 mt-2 tracking-widest">
                    此局：{SUDOKU_DIFFICULTY_LABELS[selectedPuzzle.difficulty]}
                  </h2>
                </div>
                <ClassicalButton variant="secondary" onClick={restartCurrentPuzzle}>
                  重起炉灶
                </ClassicalButton>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { label: '光阴', value: game.formattedElapsed, color: 'text-stone-800' },
                  { label: '纰漏', value: game.errorCount, color: 'text-red-800' },
                  { label: '造化', value: `${game.completionPercent}%`, color: 'text-stone-800' },
                  { label: '最佳', value: currentRecord.bestSeconds === null ? '未成' : `${currentRecord.bestSeconds} 息`, color: 'text-amber-800' }
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
                puzzle={selectedPuzzle}
                board={game.board}
                selectedCell={game.selectedCell}
                onSelectCell={(row, col) => game.setSelectedCell({ row, col })}
                mistakeCell={game.mistakeCell}
              />
              <SudokuNumberPad
                values={game.values}
                onInput={game.inputValue}
                onClear={game.clearCell}
              />
            </div>

            <ClassicalCard className="text-sm text-stone-600 leading-relaxed font-bold tracking-widest text-center py-4">
              落子无悔：点按虚空，再印数字。错则记过，对则留痕。
            </ClassicalCard>
          </div>
        </div>
      </div>

      {game.completed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#f4ece1] border-4 border-stone-800 p-8 max-w-sm w-full relative shadow-[8px_8px_0_0_#292524] animate-pop">
            <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-stone-600 pointer-events-none" />
            <h3 className="text-3xl font-bold text-stone-900 text-center mb-6 tracking-[0.3em] relative z-10">破局成功</h3>
            
            <div className="space-y-6 relative z-10">
              <p className="text-center text-stone-700 tracking-widest font-bold">
                阁下已解开 <span className="text-red-900 text-lg">{selectedPuzzle.title}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-stone-800 bg-[#e8dcc8] px-4 py-4 text-center">
                  <p className="text-xs text-stone-500 tracking-widest">耗时</p>
                  <p className="mt-2 text-xl font-bold text-stone-800">{game.elapsedSeconds} 息</p>
                </div>
                <div className="border-2 border-stone-800 bg-[#e8dcc8] px-4 py-4 text-center">
                  <p className="text-xs text-stone-500 tracking-widest">纰漏</p>
                  <p className="mt-2 text-xl font-bold text-red-800">{game.errorCount} 次</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <ClassicalButton variant="secondary" className="flex-1" onClick={restartCurrentPuzzle}>
                  再来一局
                </ClassicalButton>
                {nextPuzzle ? (
                  <ClassicalButton className="flex-1" onClick={() => setSelectedPuzzleId(nextPuzzle.id)}>
                    下一关卡
                  </ClassicalButton>
                ) : (
                  <ClassicalButton className="flex-1" onClick={() => setSelectedSize(nextSize)}>
                    前往下区
                  </ClassicalButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
