'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/24-point/ui/Button'
import Card from '@/components/24-point/ui/Card'
import Modal from '@/components/24-point/ui/Modal'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import SudokuBoard from '@/components/sudoku/SudokuBoard'
import SudokuNumberPad from '@/components/sudoku/SudokuNumberPad'
import { useLocalSudokuProgress } from '@/hooks/sudoku/useLocalProgress'
import { useSudokuGame } from '@/hooks/sudoku/useSudokuGame'
import { getSudokuPuzzlesBySize } from '@/lib/sudoku/puzzles'
import { SUDOKU_DIFFICULTY_LABELS, SUDOKU_SIZE_CONFIG, type SudokuSize } from '@/types/sudoku'

const SIZE_OPTIONS: SudokuSize[] = ['4x4', '6x6', '9x9']

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
  if (!access.allowed) return <div className="min-h-dvh" />
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
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link href="/sudoku" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">单人闯关</h1>
          <div className="w-[44px]" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4 sm:gap-5">
          <Card glass className="p-5 sm:p-6 space-y-5 animate-slide-up">
            <div>
              <p className="text-sm text-slate-400">闯关分区</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">从入门一路打到标准数独</h2>
            </div>

            <div className="flex gap-2 flex-wrap">
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-2xl px-4 py-3 text-left transition-all border ${
                    selectedSize === size
                      ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-200'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="font-semibold">{SUDOKU_SIZE_CONFIG[size].title}</div>
                  <div className={`text-xs mt-1 ${selectedSize === size ? 'text-sky-100' : 'text-slate-400'}`}>
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
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                      selected
                        ? 'border-sky-400 bg-sky-50 shadow-md shadow-sky-100'
                        : 'border-slate-200 bg-white'
                    } ${!unlocked ? 'opacity-45 cursor-not-allowed' : 'hover:border-sky-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{puzzle.title}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          难度：{SUDOKU_DIFFICULTY_LABELS[puzzle.difficulty]}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        completed ? 'bg-emerald-50 text-emerald-600' : unlocked ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {completed ? '已通关' : unlocked ? '可挑战' : '未解锁'}
                      </span>
                    </div>
                    {(record.bestSeconds !== null || record.lowestErrors !== null) && (
                      <p className="mt-2 text-xs text-slate-400">
                        最佳用时 {record.bestSeconds ?? '-'} 秒 · 最少错误 {record.lowestErrors ?? '-'} 次
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="space-y-4 animate-slide-up">
            <Card glass className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">
                    {SUDOKU_SIZE_CONFIG[selectedPuzzle.size].title} · {selectedPuzzle.title}
                  </p>
                  <h2 className="text-2xl font-black text-slate-800 mt-1">
                    当前关卡：{SUDOKU_DIFFICULTY_LABELS[selectedPuzzle.difficulty]}
                  </h2>
                </div>
                <Button variant="secondary" size="sm" onClick={restartCurrentPuzzle}>
                  重新开始
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
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
                <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                  <p className="text-xs text-slate-400">最好成绩</p>
                  <p className="text-base font-bold text-slate-800 mt-2">
                    {currentRecord.bestSeconds === null ? '未通关' : `${currentRecord.bestSeconds} 秒`}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
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

            <Card glass className="p-4 sm:p-5 text-sm text-slate-500 leading-7">
              玩法很简单：点击一个空格，再点击下面的数字键盘。填错会记一次错误，填对就会直接落子。
            </Card>
          </div>
        </div>
      </div>

      <Modal open={game.completed} title="闯关成功" closable={false}>
        <div className="space-y-4">
          <p className="text-center text-slate-600">
            你完成了 <span className="font-semibold text-slate-800">{selectedPuzzle.title}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-400">本次用时</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{game.elapsedSeconds} 秒</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-400">错误次数</p>
              <p className="mt-1 text-lg font-bold text-rose-500">{game.errorCount} 次</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={restartCurrentPuzzle}>
              再来一次
            </Button>
            {nextPuzzle ? (
              <Button className="flex-1" onClick={() => setSelectedPuzzleId(nextPuzzle.id)}>
                下一关
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => setSelectedSize(nextSize)}>
                切换下一区
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
