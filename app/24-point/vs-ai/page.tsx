'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/hooks/24-point/useGame'
import { useNickname } from '@/hooks/24-point/useNickname'
import { useAiOpponent } from '@/hooks/24-point/useAiOpponent'
import GameBoard from '@/components/24-point/game/GameBoard'
import GameResult from '@/components/24-point/game/GameResult'
import AiOpponent from '@/components/24-point/ai/AiOpponent'
import DifficultySelect from '@/components/24-point/ai/DifficultySelect'
import NicknameInput from '@/components/24-point/ui/NicknameInput'
import Link from 'next/link'
import type { AiDifficulty } from '@/types/24-point'
import { AI_CONFIG } from '@/types/24-point'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

const ROUND_OPTIONS = [1, 3, 5, 7, 10]
const TIME_OPTIONS = [30, 45, 60, 90, 120]

export default function VsAiPage() {
  const router = useRouter()
  const { nickname, setNickname, hasNickname, isReady } = useNickname()
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用 24 点挑战。',
  })
  const [difficulty, setDifficulty] = useState<AiDifficulty | null>(null)
  const [aiScore, setAiScore] = useState(0)
  const [totalRounds, setTotalRounds] = useState(5)
  const [timePerRound, setTimePerRound] = useState(60)

  const game = useGame({
    totalRounds,
    timePerRound,
  })

  const handleAiSolved = useCallback(() => {
    // AI 先答出来了
    if (game.isPlaying && !game.feedback) {
      setAiScore((s) => s + 1)
      // 自动进入下一轮
      game.handleSkip()
    }
  }, [game])

  const adaptiveContext = useMemo(
    () => ({
      playerScore: game.score,
      aiScore,
      round: game.round || 1,
      totalRounds: game.totalRounds,
    }),
    [game.score, aiScore, game.round, game.totalRounds],
  )

  const { aiExpression, aiThinking, aiSolved, resolvedDifficulty, resetAi } = useAiOpponent({
    difficulty: difficulty || 'normal',
    numbers: game.numbers,
    isPlaying: game.isPlaying,
    onAiSolved: handleAiSolved,
    adaptiveContext,
  })

  const selectedAiLabel = difficulty ? AI_CONFIG[difficulty].label : 'AI'
  const currentAiLabel = AI_CONFIG[resolvedDifficulty].label
  const aiDisplayName =
    difficulty === 'adaptive' ? `AI·自适应(${currentAiLabel})` : `AI·${selectedAiLabel}`
  const aiDisplayDescription =
    difficulty === 'adaptive'
      ? `当前强度：${currentAiLabel} · ${AI_CONFIG[resolvedDifficulty].description}`
      : AI_CONFIG[difficulty || 'normal'].description

  const handleSelectDifficulty = (diff: AiDifficulty) => {
    setDifficulty(diff)
  }

  const handleStartGame = () => {
    setAiScore(0)
    resetAi()
    game.startGame()
  }

  const handlePlayAgain = () => {
    setAiScore(0)
    resetAi()
    game.startGame()
  }

  if (!isReady || access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh" />

  return (
    <div className="min-h-dvh flex flex-col items-center px-3 sm:px-4 py-2 sm:py-6">
      <NicknameInput open={!hasNickname} onSubmit={setNickname} />

      {/* 顶部导航 */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3 sm:mb-6">
        <Link
          href="/24-point"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors min-h-[44px] min-w-[44px] px-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-700">人机对战</h1>
        <div className="w-[44px]" />
      </div>

      {/* 未选择难度 */}
      {!difficulty && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg md:max-w-xl">
          <div className="text-center mb-8 animate-slide-up">
            <div className="text-6xl mb-4 animate-float">🤖</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">选择对手难度</h2>
            <p className="text-gray-400">除了固定难度，现在也可以让 AI 按你的表现自动调节</p>
          </div>
          <div className="w-full animate-slide-up">
            <DifficultySelect onSelect={handleSelectDifficulty} />
          </div>
        </div>
      )}

      {/* 已选难度但未开始 */}
      {difficulty && !game.isPlaying && !game.isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg md:max-w-xl">
          <div className="text-center mb-6 animate-slide-up">
            <div className="text-6xl mb-4 animate-float">⚔️</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              {nickname} vs AI ({selectedAiLabel})
            </h2>
            <p className="text-gray-400">
              {difficulty === 'adaptive'
                ? `${totalRounds} 轮比赛，每轮 ${timePerRound} 秒，AI 会按你的表现自动升降强度`
                : `${totalRounds} 轮比赛，每轮 ${timePerRound} 秒`}
            </p>
          </div>

          {/* 设置区域 */}
          <div className="w-full space-y-4 mb-6 animate-slide-up">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">比赛轮数</label>
              <div className="flex gap-2 flex-wrap">
                {ROUND_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setTotalRounds(n)}
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
            <div className="space-y-2">
              <label className="text-sm text-gray-500">每轮时间</label>
              <div className="flex gap-2 flex-wrap">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimePerRound(t)}
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
          </div>

          <div className="flex gap-3 animate-slide-up">
            <button
              onClick={() => setDifficulty(null)}
              className="px-5 min-h-[48px] rounded-xl text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer font-medium"
            >
              换难度
            </button>
            <button
              onClick={handleStartGame}
              className="px-8 min-h-[48px] rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md shadow-indigo-200/50 hover:shadow-lg transition-all cursor-pointer font-bold"
            >
              开始对战
            </button>
          </div>
        </div>
      )}

      {/* 游戏进行中 */}
      {difficulty && (game.isPlaying || game.isFinished) && (
        <div className="w-full max-w-3xl animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            {/* 玩家面板 */}
            <GameBoard
              numbers={game.numbers}
              expression={game.expression}
              usedNumbers={game.usedNumbers}
              timeLeft={game.timeLeft}
              feedback={game.feedback}
              isPlaying={game.isPlaying}
              hint={game.hint}
              playerName={nickname || '我'}
              playerScore={game.score}
              opponentName={aiDisplayName}
              opponentScore={aiScore}
              round={game.round}
              totalRounds={game.totalRounds}
              onNumberClick={game.handleNumberClick}
              onOperator={game.handleOperator}
              onBackspace={game.handleBackspace}
              onClear={game.handleClear}
              onSubmit={game.handleSubmit}
              onHint={game.handleHint}
              onSkip={game.handleSkip}
              showHint={false}
            />

            {/* AI 面板 — 移动端紧凑展示 */}
            <div className="space-y-2 md:space-y-3 lg:space-y-4">
              <AiOpponent
                numbers={game.numbers}
                aiExpression={aiExpression}
                aiThinking={aiThinking}
                aiSolved={aiSolved}
                aiName={aiDisplayName}
                difficulty={aiDisplayDescription}
              />
              <div className="text-center text-xs text-gray-300 hidden md:block">
                对手面板（只读）
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 结果弹窗 */}
      <GameResult
        open={game.isFinished}
        playerName={nickname || '我'}
        playerScore={game.score}
        opponentName={difficulty ? aiDisplayName : 'AI'}
        opponentScore={aiScore}
        totalRounds={game.totalRounds}
        onPlayAgain={handlePlayAgain}
        onExit={() => router.push('/24-point')}
      />
    </div>
  )
}
