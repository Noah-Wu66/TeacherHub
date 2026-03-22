'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'
import SudokuBoard from '@/components/sudoku/SudokuBoard'
import SudokuNumberPad from '@/components/sudoku/SudokuNumberPad'
import { useSudokuGame } from '@/hooks/sudoku/useSudokuGame'
import { getSudokuPuzzlesBySizeAndDifficulty } from '@/lib/sudoku/puzzles'
import { countFilledSudokuCells } from '@/lib/sudoku/board'
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
  const base = "px-4 py-2 font-bold tracking-widest border-2 transition-all duration-150 relative disabled:opacity-50 disabled:cursor-not-allowed text-center"
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

export default function SudokuVsAiPage() {
  const router = useRouter()
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用数独挑战。',
  })
  const game = useSudokuGame()
  const [selectedSize, setSelectedSize] = useState<SudokuSize>('4x4')
  const [selectedDifficulty, setSelectedDifficulty] = useState<SudokuDifficulty>('easy')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null)

  // AI 状态
  const [aiFilledCount, setAiFilledCount] = useState(0)
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const puzzle = useMemo(() => {
    return getSudokuPuzzlesBySizeAndDifficulty(selectedSize, selectedDifficulty)[0]
  }, [selectedDifficulty, selectedSize])

  const totalCells = useMemo(() => {
    if (!puzzle) return 16
    return puzzle.solution.length * puzzle.solution.length
  }, [puzzle])

  const initialFilledCount = useMemo(() => {
    if (!puzzle) return 0
    return countFilledSudokuCells(puzzle.initial)
  }, [puzzle])

  // 重置游戏
  const restartGame = useCallback(() => {
    if (!puzzle) return
    game.loadPuzzle(puzzle)
    setGameStarted(false)
    setGameEnded(false)
    setWinner(null)
    setAiFilledCount(initialFilledCount)
    if (aiIntervalRef.current) {
      clearInterval(aiIntervalRef.current)
      aiIntervalRef.current = null
    }
  }, [game, puzzle, initialFilledCount])

  useEffect(() => {
    restartGame()
  }, [restartGame])

  // AI 填数逻辑
  useEffect(() => {
    if (!gameStarted || gameEnded || !puzzle) return

    // 难度对应的 AI 每填一个格子的平均毫秒数
    // 简单：较慢，中等：中速，困难：较快
    const baseSpeedMap = {
      '4x4': { easy: 4000, normal: 3000, hard: 2000 },
      '6x6': { easy: 3000, normal: 2000, hard: 1200 },
      '9x9': { easy: 2500, normal: 1500, hard: 800 },
    }
    const baseSpeed = baseSpeedMap[selectedSize][selectedDifficulty]

    const tick = () => {
      setAiFilledCount((prev) => {
        const next = prev + 1
        if (next >= totalCells) {
          if (aiIntervalRef.current) clearInterval(aiIntervalRef.current)
          setGameEnded(true)
          setWinner('ai')
          return totalCells
        }
        return next
      })

      // 随机波动速度，让 AI 显得更真实
      const nextSpeed = baseSpeed * (0.8 + Math.random() * 0.4)
      aiIntervalRef.current = setTimeout(tick, nextSpeed)
    }

    aiIntervalRef.current = setTimeout(tick, baseSpeed)

    return () => {
      if (aiIntervalRef.current) {
        clearTimeout(aiIntervalRef.current)
        aiIntervalRef.current = null
      }
    }
  }, [gameStarted, gameEnded, puzzle, selectedSize, selectedDifficulty, totalCells])

  // 监听玩家完成
  useEffect(() => {
    if (gameStarted && !gameEnded && game.completed) {
      setGameEnded(true)
      setWinner('player')
      if (aiIntervalRef.current) {
        clearInterval(aiIntervalRef.current)
        aiIntervalRef.current = null
      }
    }
  }, [game.completed, gameStarted, gameEnded])

  const startGame = () => {
    setGameStarted(true)
  }

  if (access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh bg-[#f4ece1]" />
  if (!puzzle) return null

  const playerPercent = Math.round((game.filledCount / totalCells) * 100)
  const aiPercent = Math.round((aiFilledCount / totalCells) * 100)

  return (
    <div className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6 bg-[#f4ece1] font-serif bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b-2 border-stone-800 pb-4">
          <Link href="/sudoku" className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-bold tracking-widest min-h-[44px] px-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold text-stone-800 tracking-[0.2em]">人机对战</h1>
          <div className="w-[44px]" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="space-y-6">
            {!gameStarted ? (
              <ClassicalCard>
                <div className="border-b border-stone-400 pb-4 mb-5">
                  <p className="text-sm text-stone-500 tracking-widest">对局设置</p>
                  <h2 className="text-2xl font-bold text-stone-800 mt-2 tracking-widest">选择智能对手难度</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-stone-600 tracking-widest">盘面大小</p>
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
                    <p className="text-sm font-bold text-stone-600 tracking-widest">对手难度</p>
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

                <div className="mt-8">
                  <ClassicalButton className="w-full" onClick={startGame}>
                    开始对决
                  </ClassicalButton>
                </div>
              </ClassicalCard>
            ) : (
              <ClassicalCard className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-400 pb-3">
                  <div>
                    <p className="text-sm text-stone-500 tracking-widest">比赛状态</p>
                    <h3 className="text-xl font-bold text-stone-800 tracking-widest mt-1">双方进度</h3>
                  </div>
                  <span className="text-xs px-3 py-1 font-bold border-2 border-amber-700 text-amber-900 bg-amber-100">
                    {gameEnded ? '对局结束' : '激战中'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* 玩家进度 */}
                  <div className="border-2 p-4 border-red-900 bg-[#d8cbb5]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-stone-900 tracking-widest">你</p>
                        <p className="text-xs text-stone-600 mt-1 font-bold">
                          已填 {game.filledCount}/{totalCells} · 错误 {game.errorCount} 次
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 font-bold border-2 ${game.completed ? 'border-amber-700 text-amber-900 bg-amber-100' : 'border-stone-500 text-stone-700 bg-[#e8dcc8]'}`}>
                        {game.completed ? '已完成' : '进行中'}
                      </span>
                    </div>
                    <div className="mt-4 h-2 border border-stone-800 bg-[#e8dcc8]">
                      <div
                        className="h-full border-r border-stone-800 bg-red-900 transition-all duration-300"
                        style={{ width: `${Math.max(2, playerPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* AI 进度 */}
                  <div className="border-2 p-4 border-stone-800 bg-[#f4ece1]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-stone-900 tracking-widest">智能对手</p>
                        <p className="text-xs text-stone-600 mt-1 font-bold">
                          已填 {aiFilledCount}/{totalCells} · 错误 0 次
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 font-bold border-2 ${aiFilledCount >= totalCells ? 'border-amber-700 text-amber-900 bg-amber-100' : 'border-stone-500 text-stone-700 bg-[#e8dcc8]'}`}>
                        {aiFilledCount >= totalCells ? '已完成' : '进行中'}
                      </span>
                    </div>
                    <div className="mt-4 h-2 border border-stone-800 bg-[#e8dcc8]">
                      <div
                        className="h-full border-r border-stone-800 bg-stone-800 transition-all duration-300"
                        style={{ width: `${Math.max(2, aiPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-stone-400">
                  <ClassicalButton variant="secondary" className="w-full" onClick={restartGame}>
                    重新开始
                  </ClassicalButton>
                </div>
              </ClassicalCard>
            )}
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
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  { label: '用时', value: gameStarted ? game.formattedElapsed : '00:00', color: 'text-stone-800' },
                  { label: '错误', value: gameStarted ? game.errorCount : 0, color: 'text-red-800' },
                  { label: '进度', value: gameStarted ? `${game.completionPercent}%` : '0%', color: 'text-stone-800' }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#f4ece1] px-4 py-3 border-2 border-stone-800 text-center">
                    <p className="text-xs text-stone-500 tracking-widest">{stat.label}</p>
                    <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </ClassicalCard>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 relative">
              {!gameStarted && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#f4ece1]/70 backdrop-blur-[2px]">
                  <div className="border-2 border-stone-800 bg-[#e8dcc8] px-6 py-4 shadow-[4px_4px_0_0_#292524]">
                    <p className="font-bold text-stone-800 tracking-widest">请先开始对决</p>
                  </div>
                </div>
              )}
              <SudokuBoard
                puzzle={puzzle}
                board={game.board}
                selectedCell={game.selectedCell}
                onSelectCell={(row, col) => game.setSelectedCell({ row, col })}
                mistakeCell={game.mistakeCell}
                readOnly={!gameStarted || gameEnded}
              />
              <SudokuNumberPad
                values={game.values}
                onInput={game.inputValue}
                onClear={game.clearCell}
                disabled={!gameStarted || gameEnded}
              />
            </div>
          </div>
        </div>
      </div>

      {gameEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#f4ece1] border-4 border-stone-800 p-8 max-w-sm w-full relative shadow-[8px_8px_0_0_#292524] animate-pop">
            <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-stone-600 pointer-events-none" />
            <h3 className="text-3xl font-bold text-stone-900 text-center mb-6 tracking-[0.3em] relative z-10">
              {winner === 'player' ? '你赢了！' : '你输了'}
            </h3>
            
            <div className="space-y-6 relative z-10">
              <p className="text-center text-stone-700 tracking-widest font-bold leading-relaxed">
                {winner === 'player' 
                  ? '厉害！你的解题速度超过了智能对手。' 
                  : '很遗憾，智能对手先一步解开了盘面。'}
              </p>
              
              <div className="flex gap-3 mt-8">
                <ClassicalButton variant="secondary" className="flex-1" onClick={() => router.push('/sudoku')}>
                  返回首页
                </ClassicalButton>
                <ClassicalButton className="flex-1" onClick={restartGame}>
                  再战一局
                </ClassicalButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
