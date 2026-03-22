'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/hooks/24-point/useGame'
import { useNickname } from '@/hooks/24-point/useNickname'
import GameBoard from '@/components/24-point/game/GameBoard'
import GameResult from '@/components/24-point/game/GameResult'
import Button from '@/components/24-point/ui/Button'
import NicknameInput from '@/components/24-point/ui/NicknameInput'
import Link from 'next/link'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

const ROUND_OPTIONS = [1, 3, 5, 7, 10]
const TIME_OPTIONS = [30, 45, 60, 90, 120]

export default function SoloPage() {
  const router = useRouter()
  const { nickname, setNickname, hasNickname, isReady } = useNickname()
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用 24 点挑战。',
  })
  const [totalRounds, setTotalRounds] = useState(5)
  const [timePerRound, setTimePerRound] = useState(60)

  const game = useGame({
    totalRounds,
    timePerRound,
  })

  if (!isReady || access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh" />

  return (
    <div className="min-h-dvh flex flex-col items-center px-3 sm:px-4 py-2 sm:py-6">
      <NicknameInput open={!hasNickname} onSubmit={setNickname} />

      {/* 顶部导航 */}
      <div className="w-full max-w-lg md:max-w-xl flex items-center justify-between mb-3 sm:mb-6">
        <Link
          href="/24-point"
          className="flex items-center gap-1 text-sm text-emerald-100/60 hover:text-white active:text-emerald-50 transition-colors min-h-[44px] min-w-[44px] px-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-white drop-shadow-sm">单人练习</h1>
        <div className="w-[44px]" />
      </div>

      {/* 游戏区域 */}
      {!game.isPlaying && !game.isFinished ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg md:max-w-xl">
          <div className="text-center mb-6 animate-slide-up">
            <div className="text-6xl mb-4 animate-float">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">准备好了吗？</h2>
            <p className="text-emerald-100/80">每轮 {timePerRound} 秒，共 {totalRounds} 轮</p>
          </div>

          {/* 设置区域 */}
          <div className="w-full space-y-4 mb-6 animate-slide-up">
            <div className="space-y-2">
              <label className="text-sm text-emerald-100/60 font-medium mb-1 block">比赛轮数</label>
              <div className="flex gap-2 flex-wrap">
                {ROUND_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setTotalRounds(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[36px] ${
                      totalRounds === n
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {n}轮
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-emerald-100/60 font-medium mb-1 block">每轮时间</label>
              <div className="flex gap-2 flex-wrap">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimePerRound(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[36px] ${
                      timePerRound === t
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {t}秒
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button size="lg" onClick={game.startGame} className="animate-slide-up px-12">
            开始游戏
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-lg md:max-w-xl animate-slide-up">
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
            round={game.round}
            totalRounds={game.totalRounds}
            onNumberClick={game.handleNumberClick}
            onOperator={game.handleOperator}
            onBackspace={game.handleBackspace}
            onClear={game.handleClear}
            onSubmit={game.handleSubmit}
            onHint={game.handleHint}
            onSkip={game.handleSkip}
          />
        </div>
      )}

      {/* 结果弹窗 */}
      <GameResult
        open={game.isFinished}
        playerName={nickname || '我'}
        playerScore={game.score}
        totalRounds={game.totalRounds}
        onPlayAgain={game.startGame}
        onExit={() => router.push('/24-point')}
      />
    </div>
  )
}
