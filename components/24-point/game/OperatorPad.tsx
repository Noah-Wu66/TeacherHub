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
  { value: '+', label: '+', color: 'bg-red-600 border-red-800 text-white shadow-red-900/50' },
  { value: '-', label: '−', color: 'bg-blue-600 border-blue-800 text-white shadow-blue-900/50' },
  { value: '*', label: '×', color: 'bg-emerald-600 border-emerald-800 text-white shadow-emerald-900/50' },
  { value: '/', label: '÷', color: 'bg-slate-800 border-black text-white shadow-black/50' },
  { value: '(', label: '(', color: 'bg-purple-600 border-purple-800 text-white shadow-purple-900/50' },
  { value: ')', label: ')', color: 'bg-purple-600 border-purple-800 text-white shadow-purple-900/50' },
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
    ? 'min-h-[36px] rounded-lg text-xs font-semibold'
    : 'min-h-[44px] sm:min-h-[48px] md:min-h-[52px] rounded-xl text-sm sm:text-base font-bold'

  return (
    <div className={`space-y-3 ${compact ? 'sm:space-y-4 md:space-y-5' : 'sm:space-y-5 md:space-y-6'}`}>
      
      {/* 运算符行 - 筹码风格 */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-5">
        {operators.map((op) => (
          <button
            key={op.value}
            onClick={() => onOperator(op.value)}
            disabled={disabled}
            className={`
              relative flex items-center justify-center flex-shrink-0
              ${compact ? 'w-10 h-10 text-lg' : 'w-12 h-12 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] text-xl sm:text-3xl'}
              rounded-full font-black select-none cursor-pointer
              border-[3px] sm:border-[4px] border-double ${op.color}
              shadow-[0_4px_0_0_rgba(0,0,0,0.4),0_6px_10px_rgba(0,0,0,0.3)]
              hover:brightness-110 active:translate-y-1 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4),0_2px_5px_rgba(0,0,0,0.3)]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(0,0,0,0.4),0_6px_10px_rgba(0,0,0,0.3)]
              transition-all duration-150
            `}
          >
            {/* 筹码内圈虚线 */}
            <div className="absolute inset-[2px] sm:inset-[3px] md:inset-1 rounded-full border border-dashed border-white/50 pointer-events-none" />
            <span className="relative z-10 drop-shadow-md">{op.label}</span>
          </button>
        ))}
      </div>

      {/* 功能按钮行 */}
      <div className={`grid ${showHint ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 sm:gap-2 md:gap-3`}>
        <button
          onClick={onBackspace}
          disabled={disabled}
          className={`${btnBase} bg-slate-800/80 text-white border border-slate-700/50 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer backdrop-blur-sm shadow-inner px-1`}
        >
          {compact ? '退格' : '← 退格'}
        </button>
        <button
          onClick={onClear}
          disabled={disabled}
          className={`${btnBase} bg-slate-800/80 text-white border border-slate-700/50 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer backdrop-blur-sm shadow-inner px-1`}
        >
          清除
        </button>
        {showHint && (
          <button
            onClick={onHint}
            disabled={disabled}
            className={`${btnBase} bg-amber-600/80 text-white border border-amber-500/50 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer backdrop-blur-sm shadow-inner px-1`}
          >
            提示
          </button>
        )}
        <button
          onClick={onSkip}
          disabled={disabled}
          className={`${btnBase} bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 select-none cursor-pointer backdrop-blur-sm shadow-inner px-1`}
        >
          跳过
        </button>
      </div>

      {/* 提交按钮 - 赌桌质感 */}
      <button
        onClick={onSubmit}
        disabled={disabled}
        className={`
          w-full ${compact ? 'min-h-[44px] rounded-lg text-base' : 'min-h-[52px] sm:min-h-[60px] rounded-xl text-xl sm:text-2xl'}
          font-black tracking-widest select-none cursor-pointer uppercase
          bg-gradient-to-b from-amber-400 to-amber-600 text-amber-950
          border-2 border-amber-300
          shadow-[0_0_15px_rgba(251,191,36,0.4),inset_0_2px_4px_rgba(255,255,255,0.6)]
          hover:brightness-110 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),inset_0_2px_4px_rgba(255,255,255,0.6)]
          active:scale-[0.98] active:shadow-[0_0_10px_rgba(251,191,36,0.4),inset_0_1px_2px_rgba(255,255,255,0.2)]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:filter-grayscale
          transition-all duration-200
        `}
      >
        VERIFY
      </button>
    </div>
  )
}
