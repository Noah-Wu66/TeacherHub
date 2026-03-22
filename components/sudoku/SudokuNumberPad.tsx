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
    <div className="bg-[#f4ece1] border-2 border-stone-800 p-4 sm:p-5 space-y-4 font-serif relative">
      <div className="absolute top-1 left-1 bottom-1 right-1 border border-stone-400 pointer-events-none" />
      
      <div className="grid grid-cols-5 gap-2 sm:gap-3 relative z-10">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onInput(value)}
            className="
              relative bg-[#e8dcc8] text-stone-900 font-bold text-xl sm:text-2xl
              min-h-[52px] sm:min-h-[60px]
              border-2 border-stone-800 shadow-[2px_2px_0_0_#292524]
              transition-all duration-150
              hover:bg-[#d8cbb5] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#292524]
              active:translate-y-1 active:shadow-[0px_0px_0_0_#292524]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[2px_2px_0_0_#292524]
              flex items-center justify-center
            "
          >
            {/* 角落装饰 */}
            <span className="absolute top-0.5 left-0.5 w-1 h-1 bg-stone-800/30" />
            <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-stone-800/30" />
            <span className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-stone-800/30" />
            <span className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-stone-800/30" />
            
            {value}
          </button>
        ))}
      </div>
      
      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        className="
          w-full bg-red-900 text-[#f4ece1] font-bold text-lg tracking-[0.2em]
          min-h-[48px] sm:min-h-[52px]
          border-2 border-stone-900 shadow-[2px_2px_0_0_#292524]
          transition-all duration-150 relative z-10
          hover:bg-red-800 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#292524]
          active:translate-y-1 active:shadow-[0px_0px_0_0_#292524]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[2px_2px_0_0_#292524]
        "
      >
        抹去印记
      </button>
    </div>
  )
}
