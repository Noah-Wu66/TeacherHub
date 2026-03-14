'use client'

interface OperatorPadProps {
  onOperator: (op: string) => void
  onBackspace: () => void
  onClear: () => void
  onSubmit: () => void
  onHint: () => void
  onSkip: () => void
  disabled?: boolean
  compact?: boolean
  showHint?: boolean
}

const operators = [
  { value: '+', label: '+' },
  { value: '-', label: '−' },
  { value: '*', label: '×' },
  { value: '/', label: '÷' },
  { value: '(', label: '(' },
  { value: ')', label: ')' },
]

export default function OperatorPad({
  onOperator,
  onBackspace,
  onClear,
  onSubmit,
  onHint,
  onSkip,
  disabled = false,
  compact = false,
  showHint = true,
}: OperatorPadProps) {
  const btnBase = compact
    ? 'min-h-[44px] rounded-lg text-sm md:text-base font-semibold'
    : 'min-h-[44px] sm:min-h-[52px] md:min-h-[56px] rounded-xl text-base sm:text-lg md:text-xl font-bold'

  return (
    <div className={`space-y-1.5 ${compact ? '' : 'sm:space-y-2 md:space-y-2.5'}`}>
      {/* 运算符行 — 移动端3列2行，平板及以上6列 */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 md:gap-2.5">
        {operators.map((op) => (
          <button
            key={op.value}
            onClick={() => onOperator(op.value)}
            disabled={disabled}
            className={`
              ${btnBase}
              bg-white border border-gray-200 text-indigo-600
              hover:bg-indigo-50 hover:border-indigo-200
              active:bg-indigo-100
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150 select-none cursor-pointer
              shadow-sm hover:shadow
            `}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* 功能按钮行 */}
      <div className={`grid ${showHint ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-1.5 sm:gap-2 md:gap-2.5`}>
        <button
          onClick={onBackspace}
          disabled={disabled}
          className={`${btnBase} bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer`}
        >
          ← 退格
        </button>
        <button
          onClick={onClear}
          disabled={disabled}
          className={`${btnBase} bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer`}
        >
          清除
        </button>
        {showHint && (
          <button
            onClick={onHint}
            disabled={disabled}
            className={`${btnBase} bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 active:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer`}
          >
            提示
          </button>
        )}
        <button
          onClick={onSkip}
          disabled={disabled}
          className={`${btnBase} bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer`}
        >
          跳过
        </button>
      </div>

      {/* 提交按钮 */}
      <button
        onClick={onSubmit}
        disabled={disabled}
        className={`
          w-full ${compact ? 'min-h-[44px] rounded-lg text-base' : 'min-h-[48px] sm:min-h-[52px] md:min-h-[56px] rounded-xl text-lg'}
          font-bold select-none cursor-pointer
          bg-gradient-to-r from-indigo-500 to-purple-500 text-white
          shadow-md shadow-indigo-200/50
          hover:shadow-lg hover:shadow-indigo-300/50
          active:shadow-sm active:scale-[0.99]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
          transition-all duration-200
        `}
      >
        = 验证
      </button>
    </div>
  )
}
