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
                  ? 'bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-lg shadow-indigo-200/60 hover:shadow-xl hover:shadow-indigo-300/60 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md active:bg-indigo-600'
                  : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
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
