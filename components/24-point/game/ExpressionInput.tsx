'use client'

interface ExpressionInputProps {
  expression: string
  isActive: boolean
  feedback?: 'success' | 'error' | null
  compact?: boolean
}

export default function ExpressionInput({
  expression,
  isActive,
  feedback,
  compact = false,
}: ExpressionInputProps) {
  return (
    <div
      className={`
        ${compact ? 'min-h-[44px] md:min-h-[48px] px-3 py-2 text-base md:text-lg rounded-xl' : 'min-h-[52px] sm:min-h-[60px] md:min-h-[64px] px-3 sm:px-4 md:px-5 py-2 sm:py-3 text-lg sm:text-2xl md:text-2xl rounded-2xl'}
        w-full font-mono font-medium
        flex items-center justify-center
        overflow-x-auto overflow-y-hidden
        break-all whitespace-nowrap
        transition-all duration-300
        select-none
        ${
          feedback === 'success'
            ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700 shadow-inner shadow-emerald-100'
            : feedback === 'error'
              ? 'bg-rose-50 border-2 border-rose-300 text-rose-700 animate-shake'
              : 'bg-gray-50/80 border-2 border-gray-100 text-gray-800'
        }
      `}
    >
      {expression || (
        <span className="text-gray-300 text-sm sm:text-base md:text-base font-normal font-sans whitespace-normal">
          {isActive ? '点击数字开始输入...' : '等待开始'}
        </span>
      )}
    </div>
  )
}
