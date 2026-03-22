'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cloneSudokuBoard,
  countFilledSudokuCells,
  createSudokuBoard,
  formatSudokuElapsed,
  getSudokuCompletionPercent,
  getSudokuConflicts,
  getSudokuHint,
  getSudokuValueList,
  isMutableSudokuCell,
  isSudokuBoardShapeValid,
  isSudokuBoardSolved,
} from '@/lib/sudoku/board'
import { useSudokuAudio } from '@/hooks/sudoku/useSudokuAudio'
import type { SudokuBoard, SudokuHint, SudokuPuzzle } from '@/types/sudoku'

type SelectedCell = { row: number; col: number } | null

type LoadPuzzleOptions = {
  board?: SudokuBoard
  errorCount?: number
  startedAt?: number | string | null
  completedAt?: number | string | null
}

function normalizeTimestamp(value?: number | string | null): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value) {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function findFirstMutableCell(puzzle: SudokuPuzzle, board: SudokuBoard): SelectedCell {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (isMutableSudokuCell(puzzle, row, col) && board[row][col] === 0) {
        return { row, col }
      }
    }
  }
  return null
}

function hasSudokuSolution(puzzle: SudokuPuzzle, board: SudokuBoard): boolean {
  return Array.isArray(puzzle.solution) && puzzle.solution.length === board.length
}

export function useSudokuGame(options?: { validationMode?: 'solution' | 'rule' }) {
  const validationMode = options?.validationMode ?? 'solution'
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null)
  const [board, setBoard] = useState<SudokuBoard>([])
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null)
  const [errorCount, setErrorCount] = useState(0)
  const [hint, setHint] = useState<SudokuHint | null>(null)
  const [completed, setCompleted] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [completedAt, setCompletedAt] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [mistakeCell, setMistakeCell] = useState<SelectedCell>(null)
  const mistakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { playInput, playSelect, playClear, playError, playHint, playSuccess } = useSudokuAudio(puzzle !== null && !completed)

  const loadPuzzle = useCallback((nextPuzzle: SudokuPuzzle, options?: LoadPuzzleOptions) => {
    const isShapeValid = options?.board ? isSudokuBoardShapeValid(options.board, nextPuzzle.size) : false
    const nextBoard = isShapeValid && options?.board ? cloneSudokuBoard(options.board) : createSudokuBoard(nextPuzzle.initial)
    const nextStartedAt = normalizeTimestamp(options?.startedAt) ?? Date.now()
    const nextCompletedAt = normalizeTimestamp(options?.completedAt)
    const solved =
      nextCompletedAt !== null ||
      (
        validationMode === 'solution' &&
        hasSudokuSolution(nextPuzzle, nextBoard) &&
        isSudokuBoardSolved(nextBoard, nextPuzzle.solution)
      )

    setPuzzle(nextPuzzle)
    setBoard(nextBoard)
    setSelectedCell(findFirstMutableCell(nextPuzzle, nextBoard))
    setErrorCount(options?.errorCount ?? 0)
    setHint(null)
    setCompleted(solved)
    setStartedAt(nextStartedAt)
    setCompletedAt(nextCompletedAt ?? (solved ? Date.now() : null))
    const endTime = nextCompletedAt ?? (solved ? Date.now() : null)
    setElapsedSeconds(Math.floor(((endTime ?? Date.now()) - nextStartedAt) / 1000))
    setMistakeCell(null)
  }, [validationMode])

  useEffect(() => {
    if (!startedAt) return
    if (completed) return

    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [completed, startedAt])

  useEffect(() => {
    return () => {
      if (mistakeTimerRef.current) {
        clearTimeout(mistakeTimerRef.current)
      }
    }
  }, [])

  const triggerMistake = useCallback((row: number, col: number) => {
    playError()
    setErrorCount((prev: number) => prev + 1)
    setMistakeCell({ row, col })
    if (mistakeTimerRef.current) {
      clearTimeout(mistakeTimerRef.current)
    }
    mistakeTimerRef.current = setTimeout(() => {
      setMistakeCell(null)
    }, 700)
  }, [])

  const inputValue = useCallback((value: number) => {
    if (!puzzle || !selectedCell || completed) {
      return false
    }

    const { row, col } = selectedCell
    if (!isMutableSudokuCell(puzzle, row, col)) {
      return false
    }

    const nextBoard = cloneSudokuBoard(board)
    nextBoard[row][col] = value

    if (validationMode === 'rule') {
      const conflicts = getSudokuConflicts(nextBoard, row, col, puzzle.size)
      if (conflicts.rowConflict || conflicts.colConflict || conflicts.boxConflict) {
        triggerMistake(row, col)
        return false
      }

      setBoard(nextBoard)
      setHint(null)
      playInput()
      return true
    }

    const correctValue = puzzle.solution[row][col]
    if (value !== correctValue) {
      triggerMistake(row, col)
      return false
    }

    setBoard(nextBoard)
    if (isSudokuBoardSolved(nextBoard, puzzle.solution)) {
      const finishTime = Date.now()
      setCompleted(true)
      setCompletedAt(finishTime)
      if (startedAt) {
        setElapsedSeconds(Math.floor((finishTime - startedAt) / 1000))
      }
      playSuccess()
    } else {
      playInput()
    }
    setHint(null)
    return true
  }, [board, completed, puzzle, selectedCell, startedAt, triggerMistake, validationMode, playInput, playSuccess])

  const clearCell = useCallback(() => {
    if (!puzzle || !selectedCell || completed) {
      return
    }
    const { row, col } = selectedCell
    if (!isMutableSudokuCell(puzzle, row, col)) {
      return
    }

    setBoard((prevBoard: SudokuBoard) => {
      if (prevBoard[row][col] === 0) {
        return prevBoard
      }
      const nextBoard = cloneSudokuBoard(prevBoard)
      nextBoard[row][col] = 0
      return nextBoard
    })
    setHint(null)
    playClear()
  }, [completed, puzzle, selectedCell, playClear])

  const requestHint = useCallback(() => {
    if (!puzzle || completed || !hasSudokuSolution(puzzle, board)) {
      return null
    }
    const nextHint = getSudokuHint(board, puzzle, hint)
    setHint(nextHint)
    if (nextHint) {
      setSelectedCell({ row: nextHint.row, col: nextHint.col })
      playHint()
    }
    return nextHint
  }, [board, completed, hint, playHint, puzzle])

  const applyHintAnswer = useCallback(() => {
    if (!hint || hint.level !== 'answer' || !puzzle || completed || !hasSudokuSolution(puzzle, board)) {
      return false
    }
    const { row, col } = hint
    if (!isMutableSudokuCell(puzzle, row, col)) {
      return false
    }

    setSelectedCell({ row, col })
    setBoard((prevBoard: SudokuBoard) => {
      const nextBoard = cloneSudokuBoard(prevBoard)
      nextBoard[row][col] = hint.answer
      if (isSudokuBoardSolved(nextBoard, puzzle.solution)) {
        const finishTime = Date.now()
        setCompleted(true)
        setCompletedAt(finishTime)
        if (startedAt) {
          setElapsedSeconds(Math.floor((finishTime - startedAt) / 1000))
        }
        playSuccess()
      } else {
        playInput()
      }
      return nextBoard
    })
    setHint(null)
    return true
  }, [board, completed, hint, puzzle, startedAt, playInput, playSuccess])

  const filledCount = useMemo(() => countFilledSudokuCells(board), [board])
  const completionPercent = useMemo(() => {
    if (!puzzle) return 0
    return getSudokuCompletionPercent(board, puzzle)
  }, [board, puzzle])

  const formattedElapsed = useMemo(() => formatSudokuElapsed(elapsedSeconds), [elapsedSeconds])
  const values = useMemo(() => (puzzle ? getSudokuValueList(puzzle.size) : []), [puzzle])

  const setSelectedCellWrapper = useCallback((cell: SelectedCell) => {
    setSelectedCell(cell)
    if (cell) {
      playSelect()
    }
  }, [playSelect])

  return {
    puzzle,
    board,
    selectedCell,
    errorCount,
    hint,
    completed,
    startedAt,
    completedAt,
    elapsedSeconds,
    formattedElapsed,
    filledCount,
    completionPercent,
    values,
    mistakeCell,
    loadPuzzle,
    setSelectedCell: setSelectedCellWrapper,
    inputValue,
    clearCell,
    requestHint,
    applyHintAnswer,
    setErrorCount,
  }
}
