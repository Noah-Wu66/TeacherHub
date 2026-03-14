'use client'

import Modal from '@/components/24-point/ui/Modal'
import Button from '@/components/24-point/ui/Button'

interface GameResultProps {
  open: boolean
  playerName: string
  playerScore: number
  opponentName?: string
  opponentScore?: number
  totalRounds: number
  onPlayAgain: () => void
  onExit: () => void
}

export default function GameResult({
  open,
  playerName,
  playerScore,
  opponentName,
  opponentScore,
  totalRounds,
  onPlayAgain,
  onExit,
}: GameResultProps) {
  const isVs = opponentName !== undefined && opponentScore !== undefined
  const won = isVs ? playerScore > opponentScore! : false
  const tied = isVs ? playerScore === opponentScore! : false

  const title = isVs
    ? won
      ? '🎉 你赢了！'
      : tied
        ? '🤝 平局'
        : '😢 你输了'
    : '游戏结束'

  return (
    <Modal open={open} closable={false} title={title}>
      <div className="space-y-5">
        {/* 分数展示 */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">{playerName}</div>
            <div className={`text-4xl md:text-5xl font-bold ${isVs && won ? 'text-indigo-500' : 'text-gray-700'}`}>
              {playerScore}
            </div>
          </div>
          {isVs && (
            <>
              <div className="text-2xl text-gray-300 font-light">:</div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">{opponentName}</div>
                <div className={`text-4xl md:text-5xl font-bold ${!won && !tied ? 'text-rose-500' : 'text-gray-700'}`}>
                  {opponentScore}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="text-center text-gray-400 text-sm">
          共 {totalRounds} 轮
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 md:gap-4">
          <Button variant="secondary" className="flex-1" onClick={onExit}>
            返回首页
          </Button>
          <Button className="flex-1" onClick={onPlayAgain}>
            再来一局
          </Button>
        </div>
      </div>
    </Modal>
  )
}
