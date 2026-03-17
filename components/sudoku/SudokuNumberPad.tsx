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
              rounded-2xl bg-sky-50 text-sky-700 font-bold text-lg sm:text-xl
              min-h-[52px] sm:min-h-[60px]
              border border-sky-100 shadow-sm
              transition-all duration-150
              hover:bg-sky-100 active:scale-[0.97]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
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
          border border-slate-200
          transition-all duration-150 hover:bg-slate-200 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        "
      >
        擦除当前格
      </button>
    </div>
  )
}
