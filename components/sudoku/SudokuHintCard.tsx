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
    <div className="rounded-[28px] bg-white/75 border border-white/60 shadow-lg shadow-amber-100/50 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">教学陪练</p>
          <h3 className="text-lg font-semibold text-slate-800">分层提示</h3>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onRequestHint}
          className="
            rounded-2xl bg-amber-500 text-white px-4 py-2.5 font-medium shadow-md shadow-amber-200
            transition-all duration-150 hover:bg-amber-600 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          "
        >
          获取提示
        </button>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 min-h-[108px]">
        {hint ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-white text-amber-600 px-2 py-1">
                {hint.level === 'observe' ? '第 1 层' : hint.level === 'candidates' ? '第 2 层' : '第 3 层'}
              </span>
              <span className="text-amber-700">{hint.focusLabel}</span>
            </div>
            <p className="text-sm sm:text-base text-amber-900 leading-6">{hint.message}</p>
            {hint.level === 'answer' && onApplyAnswer && (
              <button
                type="button"
                onClick={onApplyAnswer}
                className="rounded-xl bg-white px-3 py-2 text-sm text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                直接填入这一格
              </button>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center">
            <p className="text-sm text-amber-700/80 leading-6">
              点击“获取提示”后，会按“先看哪里、能填哪些数、最后给答案”的顺序一步步提示。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
