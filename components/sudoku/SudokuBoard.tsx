'use client'

import { useMemo } from 'react'
import { SUDOKU_SIZE_CONFIG, type SudokuBoard as SudokuBoardType, type SudokuHint, type SudokuPuzzle } from '@/types/sudoku'

type SelectedCell = { row: number; col: number } | null

interface SudokuBoardProps {
  puzzle: SudokuPuzzle
  board: SudokuBoardType
  selectedCell: SelectedCell
  onSelectCell?: (row: number, col: number) => void
  mistakeCell?: SelectedCell
  hint?: SudokuHint | null
  readOnly?: boolean
}

function getCellBorderStyle(row: number, col: number, puzzle: SudokuPuzzle) {
  const config = SUDOKU_SIZE_CONFIG[puzzle.size]
  const top = row === 0 || row % config.boxRows === 0 ? 3 : 1
  const left = col === 0 || col % config.boxCols === 0 ? 3 : 1
  const bottom = row === config.dimension - 1 ? 3 : (row + 1) % config.boxRows === 0 ? 3 : 1
  const right = col === config.dimension - 1 ? 3 : (col + 1) % config.boxCols === 0 ? 3 : 1

  return {
    borderTopWidth: `${top}px`,
    borderLeftWidth: `${left}px`,
    borderBottomWidth: `${bottom}px`,
    borderRightWidth: `${right}px`,
  }
}

function getTextClass(size: SudokuPuzzle['size']) {
  if (size === '4x4') return 'text-2xl sm:text-3xl'
  if (size === '6x6') return 'text-xl sm:text-2xl'
  return 'text-base sm:text-lg md:text-xl'
}

export default function SudokuBoard({
  puzzle,
  board,
  selectedCell,
  onSelectCell,
  mistakeCell,
  hint,
  readOnly = false,
}: SudokuBoardProps) {
  const config = SUDOKU_SIZE_CONFIG[puzzle.size]

  const hintKey = useMemo(() => {
    if (!hint) return ''
    return `${hint.row}-${hint.col}`
  }, [hint])

  return (
    <div
      className="w-full rounded-[28px] bg-white/80 border border-white/60 shadow-xl shadow-sky-100/60 p-3 sm:p-4"
    >
      <div
        className="grid overflow-hidden rounded-2xl bg-slate-700/90"
        style={{ gridTemplateColumns: `repeat(${config.dimension}, minmax(0, 1fr))` }}
      >
        {board.map((rowValues, row) =>
          rowValues.map((value, col) => {
            const fixed = puzzle.initial[row][col] !== 0
            const selected = selectedCell?.row === row && selectedCell?.col === col
            const sameLine =
              selectedCell &&
              (selectedCell.row === row || selectedCell.col === col) &&
              !selected
            const mistake = mistakeCell?.row === row && mistakeCell?.col === col
            const hinted = hintKey === `${row}-${col}`

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                disabled={readOnly}
                onClick={() => onSelectCell?.(row, col)}
                className={`
                  relative aspect-square flex items-center justify-center
                  transition-colors duration-150
                  ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                  ${fixed ? 'bg-slate-100 text-slate-700 font-bold' : 'bg-white text-sky-700'}
                  ${sameLine ? 'bg-sky-50' : ''}
                  ${selected ? '!bg-sky-100 ring-2 ring-inset ring-sky-400 z-10' : ''}
                  ${hinted ? '!bg-amber-50' : ''}
                  ${mistake ? '!bg-rose-100 text-rose-600 animate-sudoku-pop' : ''}
                `}
                style={getCellBorderStyle(row, col, puzzle)}
              >
                <span className={`${getTextClass(puzzle.size)} leading-none`}>
                  {value || ''}
                </span>
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
