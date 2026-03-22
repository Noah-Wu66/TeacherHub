'use client'

import type { SudokuHint } from '@/types/sudoku'

interface SudokuHintCardProps {
  hint: SudokuHint | null
  onRequestHint: () => void
  onApplyAnswer?: () => void
  disabled?: boolean
}

export default function SudokuHintCard({
  hint,
  onRequestHint,
  onApplyAnswer,
  disabled = false,
}: SudokuHintCardProps) {
  return (
    <div className="bg-[#e8dcc8] border-2 border-stone-800 p-4 sm:p-5 font-serif relative">
      <div className="absolute top-1 left-1 bottom-1 right-1 border border-stone-400 pointer-events-none" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-stone-400 pb-3">
          <div>
            <p className="text-sm text-stone-500 tracking-widest">指点迷津</p>
            <h3 className="text-xl font-bold text-stone-800 tracking-widest mt-1">锦囊妙计</h3>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={onRequestHint}
            className="
              bg-red-900 text-[#f4ece1] px-4 py-2 font-bold tracking-widest border-2 border-stone-900
              shadow-[2px_2px_0_0_#292524] transition-all duration-150
              hover:bg-red-800 active:translate-y-0.5 active:shadow-none
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            索要锦囊
          </button>
        </div>

        <div className="bg-[#f4ece1] border-2 border-stone-800 px-4 py-4 min-h-[120px] relative">
          {hint ? (
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest">
                <span className="border-2 border-stone-800 bg-[#e8dcc8] text-stone-800 px-2 py-1">
                  {hint.level === 'observe' ? '壹 · 观' : hint.level === 'candidates' ? '贰 · 算' : '叁 · 定'}
                </span>
                <span className="text-stone-600 border-b-2 border-stone-400/50 pb-0.5">{hint.focusLabel}</span>
              </div>
              <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-bold tracking-widest">{hint.message}</p>
              {hint.level === 'answer' && onApplyAnswer && (
                <button
                  type="button"
                  onClick={onApplyAnswer}
                  className="
                    mt-2 text-sm text-stone-900 border-2 border-stone-800 bg-[#d8cbb5] px-3 py-1.5 font-bold tracking-widest
                    hover:bg-[#cbb592] transition-colors shadow-[2px_2px_0_0_#292524] active:translate-y-0.5 active:shadow-none
                  "
                >
                  依计行事
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-stone-500 leading-relaxed font-bold tracking-widest text-center">
                点击“索要锦囊”后，将依次传授：<br />先观何处，再算何数，终定乾坤。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
