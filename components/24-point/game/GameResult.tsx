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
    <Modal open={open} closable={false}>
      <div className="flex flex-col items-center justify-center p-4">
        {/* 顶部标题动画 */}
        <div className={`text-6xl mb-4 animate-[bounce_1s_ease-in-out_infinite]`}>
          {isVs ? (won ? '🏆' : tied ? '🤝' : '💔') : '⭐'}
        </div>
        <h2 className={`text-2xl md:text-3xl font-black mb-6 tracking-wide drop-shadow-sm ${isVs && won ? 'text-amber-500' : 'text-slate-700'}`}>
          {title}
        </h2>

        {/* 分数展示板 */}
        <div className="flex items-center justify-center gap-6 md:gap-8 bg-slate-50/50 p-6 rounded-3xl border-2 border-slate-100 shadow-inner w-full mb-6 relative overflow-hidden">
          {/* 光带扫过特效 */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[glow_3s_ease-in-out_infinite]" />
          
          <div className="text-center relative z-10">
            <div className="text-sm font-bold text-slate-400 mb-2">{playerName}</div>
            <div className={`text-5xl md:text-6xl font-black drop-shadow-md ${isVs && won ? 'text-emerald-500' : 'text-sky-500'}`}>
              {playerScore}
            </div>
          </div>

          {isVs && (
            <>
              <div className="text-3xl font-black text-slate-200 italic">VS</div>
              <div className="text-center relative z-10">
                <div className="text-sm font-bold text-slate-400 mb-2">{opponentName}</div>
                <div className={`text-5xl md:text-6xl font-black drop-shadow-md ${!won && !tied ? 'text-emerald-500' : 'text-rose-400'}`}>
                  {opponentScore}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="text-center text-slate-400 text-sm font-semibold bg-white/80 px-4 py-1.5 rounded-full shadow-sm mb-8">
          总计对局：{totalRounds} 轮
        </div>

        {/* 操作按钮 */}
        <div className="flex w-full gap-3 md:gap-4">
          <Button variant="secondary" className="flex-1 text-base md:text-lg rounded-2xl border-2 hover:bg-slate-50" onClick={onExit}>
            🏠 返回大厅
          </Button>
          <Button className="flex-1 text-base md:text-lg rounded-2xl bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 shadow-[0_4px_0_0_rgba(2,132,199,1)] active:shadow-none active:translate-y-1" onClick={onPlayAgain}>
            🔄 再来一局
          </Button>
        </div>
      </div>
    </Modal>
  )
}
