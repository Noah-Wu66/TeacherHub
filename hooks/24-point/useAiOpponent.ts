'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAiAction, generateThinkingSteps, resolveAiDifficulty, type AdaptiveAiContext } from '@/lib/24-point/aiPlayer'
import type { AiDifficulty } from '@/types/24-point'

interface UseAiOpponentOptions {
  difficulty: AiDifficulty
  numbers: number[]
  isPlaying: boolean
  onAiSolved: () => void
  adaptiveContext?: AdaptiveAiContext
}

export function useAiOpponent({
  difficulty,
  numbers,
  isPlaying,
  onAiSolved,
  adaptiveContext,
}: UseAiOpponentOptions) {
  const [aiExpression, setAiExpression] = useState('')
  const [aiThinking, setAiThinking] = useState(false)
  const [aiSolved, setAiSolved] = useState(false)
  const [resolvedDifficulty, setResolvedDifficulty] = useState(() =>
    resolveAiDifficulty(difficulty, adaptiveContext),
  )
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const clearAiTimers = useCallback(() => {
    cancelledRef.current = true
    if (thinkTimerRef.current) {
      clearTimeout(thinkTimerRef.current)
      thinkTimerRef.current = null
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current)
      stepTimerRef.current = null
    }
  }, [])

  const resetAi = useCallback(() => {
    clearAiTimers()
    setAiExpression('')
    setAiThinking(false)
    setAiSolved(false)
    setResolvedDifficulty(resolveAiDifficulty(difficulty, adaptiveContext))
  }, [adaptiveContext, clearAiTimers, difficulty])

  // 当数字改变且游戏进行中，AI 开始思考
  useEffect(() => {
    if (!isPlaying || numbers.length === 0) {
      resetAi()
      return
    }

    cancelledRef.current = false
    setAiExpression('')
    setAiThinking(true)
    setAiSolved(false)
    setResolvedDifficulty(resolveAiDifficulty(difficulty, adaptiveContext))

    const action = getAiAction(numbers, difficulty, adaptiveContext)

    if (!action.willSolve || !action.expression) {
      // AI 不会解这题
      thinkTimerRef.current = setTimeout(() => {
        if (!cancelledRef.current) {
          setAiThinking(false)
        }
      }, action.thinkTime)
      return
    }

    // AI 会解这题，模拟思考过程
    const steps = generateThinkingSteps(action.expression)
    const stepDelay = action.thinkTime / (steps.length + 1)

    // 分步展示输入过程
    const showSteps = (index: number) => {
      if (cancelledRef.current) return

      if (index < steps.length) {
        setAiExpression(steps[index])
        stepTimerRef.current = setTimeout(() => showSteps(index + 1), stepDelay)
      } else {
        // AI 完成
        setAiThinking(false)
        setAiSolved(true)
        onAiSolved()
      }
    }

    // 开始"思考"一小段时间后开始输入
    thinkTimerRef.current = setTimeout(() => {
      if (!cancelledRef.current) {
        showSteps(0)
      }
    }, stepDelay)

    return () => {
      clearAiTimers()
    }
  }, [numbers, isPlaying, difficulty]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    aiExpression,
    aiThinking,
    aiSolved,
    resolvedDifficulty,
    resetAi,
  }
}
