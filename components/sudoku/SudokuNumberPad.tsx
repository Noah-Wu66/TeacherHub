'use client'

interface SudokuNumberPadProps {
  values: number[]
  onInput: (value: number) => void
  onClear: () => void
  disabled?: boolean
}

export default function SudokuNumberPad({
  values,
  onInput,
  onClear,
  disabled = false,
}: SudokuNumberPadProps) {
  return (
    <div className="rounded-[28px] bg-white/75 border border-white/60 shadow-lg shadow-sky-100/50 p-4 sm:p-5 space-y-3">
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onInput(value)}
            className="
              rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700 font-bold text-lg sm:text-xl
              min-h-[52px] sm:min-h-[60px]
              border border-sky-300 shadow-[0_4px_0_0_rgba(125,211,252,1)]
              transition-all duration-150
              hover:bg-sky-200 hover:brightness-105 active:translate-y-1 active:shadow-[0_0px_0_0_rgba(125,211,252,1)]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(125,211,252,1)]
            "
          >
            {value}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        className="
          w-full rounded-2xl bg-slate-100 text-slate-600 font-medium
          min-h-[48px] sm:min-h-[52px]
          border-2 border-slate-200 shadow-[0_4px_0_0_rgba(203,213,225,1)]
          transition-all duration-150 hover:bg-slate-200 active:translate-y-1 active:shadow-[0_0px_0_0_rgba(203,213,225,1)]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(203,213,225,1)]
        "
      >
        擦除当前格
      </button>
    </div>
  )
}
