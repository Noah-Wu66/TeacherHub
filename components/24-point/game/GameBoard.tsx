'use client'

import Timer from '@/components/24-point/ui/Timer'
import NumberCards from './NumberCards'
import ExpressionInput from './ExpressionInput'
import OperatorPad from './OperatorPad'
import ScoreBoard from './ScoreBoard'

interface GameBoardProps {
  // 游戏状态
  numbers: number[]
  expression: string
  usedNumbers: number[]
  timeLeft: number
  feedback: 'success' | 'error' | null
  isPlaying: boolean
  hint: string | null
  // 分数
  playerName: string
  playerScore: number
  opponentName?: string
  opponentScore?: number
  round: number
  totalRounds: number
  // 操作
  onNumberClick: (num: number) => void
  onOperator: (op: string) => void
  onBackspace: () => void
  onClear: () => void
  onSubmit: () => void
  onHint: () => void
  onSkip: () => void
  // 布局
  compact?: boolean
  className?: string
  showHint?: boolean
}

export default function GameBoard({
  numbers,
  expression,
  usedNumbers,
  timeLeft,
  feedback,
  isPlaying,
  hint,
  playerName,
  playerScore,
  opponentName,
  opponentScore,
  round,
  totalRounds,
  onNumberClick,
  onOperator,
  onBackspace,
  onClear,
  onSubmit,
  onHint,
  onSkip,
  compact = false,
  className = '',
  showHint = true,
}: GameBoardProps) {
  return (
    <div className={`space-y-3 sm:space-y-4 md:space-y-5 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6 md:p-8'} ${className}`}>
      {/* 顶部：分数 + 计时器 */}
      <div className="space-y-2 sm:space-y-3">
        <ScoreBoard
          playerName={playerName}
          playerScore={playerScore}
          opponentName={opponentName}
          opponentScore={opponentScore}
          round={round}
          totalRounds={totalRounds}
        />
        <Timer timeLeft={timeLeft} />
      </div>

      {/* 数字卡片发牌区 */}
      <div className="relative pt-2 pb-4 sm:pb-6">
        <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-2xl pointer-events-none" />
        <NumberCards
          numbers={numbers}
          usedNumbers={usedNumbers}
          onNumberClick={onNumberClick}
          disabled={!isPlaying || feedback !== null}
          compact={compact}
        />
      </div>

      {/* 表达式出牌区 */}
      <ExpressionInput
        expression={expression}
        isActive={isPlaying}
        feedback={feedback}
        compact={compact}
      />

      {/* 提示 */}
      {showHint && hint && (
        <div className="text-center text-xs sm:text-sm md:text-base font-medium text-amber-200 bg-amber-900/40 rounded-xl px-4 py-2 border border-amber-500/30">
          参考答案：{hint}
        </div>
      )}

      {/* 筹码操作面板 */}
      <div className="pt-2">
        <OperatorPad
          onOperator={onOperator}
          onBackspace={onBackspace}
          onClear={onClear}
          onSubmit={onSubmit}
          onHint={onHint}
          onSkip={onSkip}
          disabled={!isPlaying || feedback !== null}
          compact={compact}
          showHint={showHint}
        />
      </div>
    </div>
  )
}
