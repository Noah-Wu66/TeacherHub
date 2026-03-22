'use client'

interface NumberCardsProps {
  numbers: number[]
  usedNumbers: number[]
  onNumberClick: (num: number) => void
  disabled?: boolean
  compact?: boolean
}

export default function NumberCards({
  numbers,
  usedNumbers,
  onNumberClick,
  disabled = false,
  compact = false,
}: NumberCardsProps) {
  // 计算每个数字的剩余可用次数
  const getAvailableCount = (num: number, index: number) => {
    const sameNumIndices = numbers
      .map((n, i) => (n === num ? i : -1))
      .filter((i) => i !== -1)
    const posInGroup = sameNumIndices.indexOf(index)
    const usedCount = usedNumbers.filter((n) => n === num).length
    return posInGroup >= usedCount
  }

  return (
    <div className={`flex justify-center ${compact ? 'gap-1.5 sm:gap-2 md:gap-3' : 'gap-2 sm:gap-4 md:gap-5'}`}>
      {numbers.map((num, index) => {
        const available = getAvailableCount(num, index)
        return (
          <button
            key={index}
            onClick={() => !disabled && available && onNumberClick(num)}
            disabled={disabled || !available}
            className={`
              ${compact
                ? 'w-12 h-12 text-lg md:w-14 md:h-14 md:text-xl rounded-xl'
                : 'w-[60px] h-[60px] text-2xl sm:w-[72px] sm:h-[72px] sm:text-3xl md:w-20 md:h-20 md:text-4xl rounded-2xl'}
              font-bold select-none cursor-pointer
              transition-all duration-200 ease-out
              flex-shrink-0
              ${
                available && !disabled
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_6px_0_0_rgba(67,56,202,1)] hover:brightness-110 active:translate-y-1.5 active:shadow-[0_0px_0_0_rgba(67,56,202,1)]'
                  : 'bg-slate-100 text-slate-300 shadow-[0_4px_0_0_rgba(226,232,240,1)] cursor-not-allowed translate-y-0.5'
              }
            `}
          >
            {num}
          </button>
        )
      })}
    </div>
  )
}
