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
  if (size === '4x4') return 'text-2xl sm:text-4xl'
  if (size === '6x6') return 'text-xl sm:text-3xl'
  return 'text-lg sm:text-2xl'
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
      className="w-full bg-[#f4ece1] border-[4px] border-stone-800 p-2 sm:p-4 relative font-serif"
    >
      {/* 装饰边框 */}
      <div className="absolute top-1 left-1 bottom-1 right-1 border border-stone-600 pointer-events-none" />
      
      <div
        className="grid overflow-hidden border-2 border-stone-800 bg-[#e8dcc8] relative z-10"
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
                  transition-colors duration-150 border-stone-800
                  ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                  ${fixed ? 'text-stone-900 font-bold' : 'text-red-800'}
                  ${sameLine ? 'bg-[#d8cbb5] z-0' : 'bg-transparent'}
                  ${selected ? '!bg-[#cbb592] ring-inset ring-2 ring-stone-800 z-10 scale-[1.02] shadow-sm' : ''}
                  ${hinted ? '!bg-amber-200/60 ring-inset ring-2 ring-amber-600 z-10 animate-pulse-fast' : ''}
                  ${mistake ? '!bg-red-200/80 text-red-900 animate-shake ring-inset ring-2 ring-red-800 z-10' : ''}
                  hover:bg-[#d8cbb5]
                `}
                style={getCellBorderStyle(row, col, puzzle)}
              >
                <span className={`${getTextClass(puzzle.size)} leading-none font-serif tracking-widest`}>
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
