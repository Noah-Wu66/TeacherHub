'use client'

interface ScoreBoardProps {
  playerName: string
  playerScore: number
  opponentName?: string
  opponentScore?: number
  round: number
  totalRounds: number
}

export default function ScoreBoard({
  playerName,
  playerScore,
  opponentName,
  opponentScore,
  round,
  totalRounds,
}: ScoreBoardProps) {
  const hasOpponent = opponentName !== undefined && opponentScore !== undefined

  return (
    <div className={`flex items-center text-sm ${hasOpponent ? 'justify-between' : 'justify-between'} gap-2`}>
      {/* 轮次 */}
      <div className="flex items-center text-gray-400 flex-shrink-0">
        <span className="font-medium text-xs sm:text-sm">
          <span className="text-indigo-500 font-bold">{round}</span>/{totalRounds}轮
        </span>
      </div>

      {/* 分数 */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-indigo-50 min-w-0">
          <span className="text-gray-500 truncate max-w-[40px] sm:max-w-[60px] md:max-w-[80px] text-xs sm:text-sm md:text-base">{playerName}</span>
          <span className="text-indigo-600 font-bold text-sm sm:text-base md:text-lg flex-shrink-0">{playerScore}</span>
        </div>

        {hasOpponent && (
          <>
            <span className="text-gray-300 font-medium flex-shrink-0">:</span>
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-rose-50 min-w-0">
              <span className="text-rose-600 font-bold text-sm sm:text-base md:text-lg flex-shrink-0">{opponentScore}</span>
              <span className="text-gray-500 truncate max-w-[40px] sm:max-w-[60px] md:max-w-[80px] text-xs sm:text-sm md:text-base">{opponentName}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
