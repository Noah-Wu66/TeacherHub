import type {
  SudokuBoard,
  SudokuHint,
  SudokuHintLevel,
  SudokuPuzzle,
  SudokuSize,
} from '@/types/sudoku'
import { SUDOKU_SIZE_CONFIG } from '@/types/sudoku'

export function getSudokuDimension(size: SudokuSize): number {
  return SUDOKU_SIZE_CONFIG[size].dimension
}

export function getSudokuBoxShape(size: SudokuSize) {
  return {
    rows: SUDOKU_SIZE_CONFIG[size].boxRows,
    cols: SUDOKU_SIZE_CONFIG[size].boxCols,
  }
}

export function cloneSudokuBoard(board: SudokuBoard): SudokuBoard {
  return board.map((row) => [...row])
}

export function createSudokuBoard(initial: SudokuBoard): SudokuBoard {
  return cloneSudokuBoard(initial)
}

export function getSudokuValueList(size: SudokuSize): number[] {
  return Array.from({ length: getSudokuDimension(size) }, (_, index) => index + 1)
}

export function getSudokuBoardSignature(board: SudokuBoard): string {
  return board.flat().join('')
}

export function isMutableSudokuCell(puzzle: SudokuPuzzle, row: number, col: number): boolean {
  return puzzle.initial[row]?.[col] === 0
}

export function countFilledSudokuCells(board: SudokuBoard): number {
  return board.flat().filter((value) => value > 0).length
}

export function countEmptySudokuCells(board: SudokuBoard): number {
  return board.flat().filter((value) => value === 0).length
}

export function isSudokuBoardShapeValid(board: SudokuBoard, size: SudokuSize): boolean {
  const dimension = getSudokuDimension(size)
  return (
    Array.isArray(board) &&
    board.length === dimension &&
    board.every((row) => Array.isArray(row) && row.length === dimension)
  )
}

function isSudokuValueInRange(value: number, size: SudokuSize): boolean {
  return Number.isInteger(value) && value >= 1 && value <= getSudokuDimension(size)
}

function getBoxOrigin(row: number, col: number, size: SudokuSize) {
  const { rows, cols } = getSudokuBoxShape(size)
  return {
    startRow: Math.floor(row / rows) * rows,
    startCol: Math.floor(col / cols) * cols,
  }
}

export function getSudokuConflicts(board: SudokuBoard, row: number, col: number, size: SudokuSize) {
  const value = board[row]?.[col] ?? 0
  if (!value) {
    return { rowConflict: false, colConflict: false, boxConflict: false }
  }

  let rowConflict = false
  let colConflict = false
  let boxConflict = false

  for (let currentCol = 0; currentCol < board[row].length; currentCol += 1) {
    if (currentCol !== col && board[row][currentCol] === value) {
      rowConflict = true
      break
    }
  }

  for (let currentRow = 0; currentRow < board.length; currentRow += 1) {
    if (currentRow !== row && board[currentRow][col] === value) {
      colConflict = true
      break
    }
  }

  const { startRow, startCol } = getBoxOrigin(row, col, size)
  const { rows, cols } = getSudokuBoxShape(size)
  for (let currentRow = startRow; currentRow < startRow + rows; currentRow += 1) {
    for (let currentCol = startCol; currentCol < startCol + cols; currentCol += 1) {
      if ((currentRow !== row || currentCol !== col) && board[currentRow][currentCol] === value) {
        boxConflict = true
      }
    }
  }

  return { rowConflict, colConflict, boxConflict }
}

export function getSudokuCandidates(board: SudokuBoard, row: number, col: number, size: SudokuSize): number[] {
  if (board[row]?.[col] !== 0) {
    return []
  }

  return getSudokuValueList(size).filter((value) => {
    const nextBoard = cloneSudokuBoard(board)
    nextBoard[row][col] = value
    const conflicts = getSudokuConflicts(nextBoard, row, col, size)
    return !conflicts.rowConflict && !conflicts.colConflict && !conflicts.boxConflict
  })
}

export function isSudokuBoardSolved(board: SudokuBoard, solution: SudokuBoard): boolean {
  if (
    !Array.isArray(solution) ||
    solution.length !== board.length ||
    solution.some((row, index) => !Array.isArray(row) || row.length !== board[index]?.length)
  ) {
    return false
  }

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== solution[row][col]) {
        return false
      }
    }
  }
  return true
}

export function isSudokuBoardStateValid(board: SudokuBoard, puzzle: SudokuPuzzle): boolean {
  if (!isSudokuBoardShapeValid(board, puzzle.size)) {
    return false
  }

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const value = board[row][col]
      if (value !== 0 && !isSudokuValueInRange(value, puzzle.size)) {
        return false
      }
      if (!isMutableSudokuCell(puzzle, row, col) && value !== puzzle.initial[row][col]) {
        return false
      }
      if (value === 0) {
        continue
      }

      const conflicts = getSudokuConflicts(board, row, col, puzzle.size)
      if (conflicts.rowConflict || conflicts.colConflict || conflicts.boxConflict) {
        return false
      }
    }
  }

  return true
}

export function isSudokuBoardCompleteByRules(board: SudokuBoard, puzzle: SudokuPuzzle): boolean {
  return isSudokuBoardStateValid(board, puzzle) && countEmptySudokuCells(board) === 0
}

function getFocusLabel(board: SudokuBoard, row: number, col: number, size: SudokuSize): string {
  const rowEmpty = board[row].filter((value) => value === 0).length
  const colEmpty = board.map((line) => line[col]).filter((value) => value === 0).length
  const { startRow, startCol } = getBoxOrigin(row, col, size)
  const { rows, cols } = getSudokuBoxShape(size)
  let boxEmpty = 0

  for (let currentRow = startRow; currentRow < startRow + rows; currentRow += 1) {
    for (let currentCol = startCol; currentCol < startCol + cols; currentCol += 1) {
      if (board[currentRow][currentCol] === 0) {
        boxEmpty += 1
      }
    }
  }

  if (rowEmpty <= colEmpty && rowEmpty <= boxEmpty) {
    return `第 ${row + 1} 行`
  }
  if (colEmpty <= rowEmpty && colEmpty <= boxEmpty) {
    return `第 ${col + 1} 列`
  }

  const boxRowIndex = Math.floor(startRow / rows) + 1
  const boxColIndex = Math.floor(startCol / cols) + 1
  return `第 ${boxRowIndex} 行宫、第 ${boxColIndex} 列宫`
}

function getBestHintCell(board: SudokuBoard, puzzle: SudokuPuzzle) {
  let bestCell: { row: number; col: number; candidates: number[] } | null = null

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== 0) continue
      const candidates = getSudokuCandidates(board, row, col, puzzle.size)
      if (!bestCell || candidates.length < bestCell.candidates.length) {
        bestCell = { row, col, candidates }
      }
      if (candidates.length <= 1) {
        return bestCell
      }
    }
  }

  return bestCell
}

export function getSudokuHint(
  board: SudokuBoard,
  puzzle: SudokuPuzzle,
  previousHint?: SudokuHint | null,
): SudokuHint | null {
  const target = getBestHintCell(board, puzzle)
  if (!target) {
    return null
  }

  const boardSignature = getSudokuBoardSignature(board)
  let level: SudokuHintLevel = 'observe'

  if (
    previousHint &&
    previousHint.boardSignature === boardSignature &&
    previousHint.row === target.row &&
    previousHint.col === target.col
  ) {
    level =
      previousHint.level === 'observe'
        ? 'candidates'
        : previousHint.level === 'candidates'
          ? 'answer'
          : 'answer'
  }

  const focusLabel = getFocusLabel(board, target.row, target.col, puzzle.size)
  const answer = puzzle.solution[target.row][target.col]
  const locationText = `第 ${target.row + 1} 行第 ${target.col + 1} 列`

  const message =
    level === 'observe'
      ? `先看${focusLabel}，${locationText} 这个空格最值得先观察。`
      : level === 'candidates'
        ? `${locationText} 现在可以考虑的数字只有：${target.candidates.join('、')}。`
        : `${locationText} 这一格应填 ${answer}。`

  return {
    puzzleId: puzzle.id,
    row: target.row,
    col: target.col,
    level,
    message,
    candidates: target.candidates,
    answer,
    focusLabel,
    boardSignature,
  }
}

export function getSudokuCompletionPercent(board: SudokuBoard, puzzle: SudokuPuzzle): number {
  const totalToFill = countEmptySudokuCells(puzzle.initial)
  if (totalToFill === 0) {
    return 100
  }
  const filledNow = countFilledSudokuCells(board) - countFilledSudokuCells(puzzle.initial)
  return Math.max(0, Math.min(100, Math.round((filledNow / totalToFill) * 100)))
}

export function formatSudokuElapsed(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainSeconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`
}
