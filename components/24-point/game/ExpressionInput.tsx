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
            ? 'bg-emerald-500 border-2 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pop'
            : feedback === 'error'
              ? 'bg-rose-50 border-2 border-rose-400 text-rose-700 animate-shake shadow-[inset_0_0_10px_rgba(244,63,94,0.2)]'
              : 'bg-slate-100/80 border-2 border-slate-200 text-slate-800 shadow-inner'
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
