'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SudokuProgressRecord, SudokuProgressStore } from '@/types/sudoku'

const STORAGE_KEY = 'teacher-hub-sudoku-progress-v1'

function getEmptyRecord(): SudokuProgressRecord {
  return {
    completed: false,
    bestSeconds: null,
    lowestErrors: null,
    lastPlayedAt: null,
  }
}

export function useLocalSudokuProgress() {
  const [progress, setProgress] = useState<SudokuProgressStore>({})
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setProgress(JSON.parse(raw) as SudokuProgressStore)
      }
    } catch {
      setProgress({})
    } finally {
      setIsReady(true)
    }
  }, [])

  const persist = useCallback((updater: (prev: SudokuProgressStore) => SudokuProgressStore) => {
    setProgress((prev) => {
      const nextProgress = updater(prev)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress))
      return nextProgress
    })
  }, [])

  const recordAttempt = useCallback((puzzleId: string) => {
    persist((prev) => {
      const existing = prev[puzzleId] || getEmptyRecord()
      return {
        ...prev,
        [puzzleId]: {
          ...existing,
          lastPlayedAt: new Date().toISOString(),
        },
      }
    })
  }, [persist])

  const recordWin = useCallback((puzzleId: string, seconds: number, errors: number) => {
    persist((prev) => {
      const existing = prev[puzzleId] || getEmptyRecord()
      return {
        ...prev,
        [puzzleId]: {
          completed: true,
          bestSeconds: existing.bestSeconds === null ? seconds : Math.min(existing.bestSeconds, seconds),
          lowestErrors: existing.lowestErrors === null ? errors : Math.min(existing.lowestErrors, errors),
          lastPlayedAt: new Date().toISOString(),
        },
      }
    })
  }, [persist])

  const getRecord = useCallback((puzzleId: string) => {
    return progress[puzzleId] || getEmptyRecord()
  }, [progress])

  const isCompleted = useCallback((puzzleId: string) => {
    return Boolean(progress[puzzleId]?.completed)
  }, [progress])

  return {
    progress,
    isReady,
    recordAttempt,
    recordWin,
    getRecord,
    isCompleted,
  }
}
