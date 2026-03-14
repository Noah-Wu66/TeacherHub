'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { generateNumbers, canUseNumber, checkAnswer, extractNumbers } from '@/lib/24-point/gameLogic'
import { solveFirst24, hasSolution } from '@/lib/24-point/solver'

interface UseGameOptions {
  totalRounds?: number
  timePerRound?: number
  onRoundEnd?: (round: number, won: boolean) => void
  onGameEnd?: (score: number) => void
}

export function useGame(options: UseGameOptions = {}) {
  const { totalRounds = 5, timePerRound = 60, onRoundEnd, onGameEnd } = options

  const [numbers, setNumbers] = useState<number[]>([])
  const [expression, setExpression] = useState('')
  const [usedNumbers, setUsedNumbers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timePerRound)
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = null
    }
  }, [])

  // 生成保证有解的数字
  const generateSolvableNumbers = useCallback((): number[] => {
    let nums: number[]
    let attempts = 0
    do {
      nums = generateNumbers()
      attempts++
    } while (!hasSolution(nums) && attempts < 100)
    return nums
  }, [])

  // 开始新一轮
  const startNewRound = useCallback(() => {
    const newNums = generateSolvableNumbers()
    setNumbers(newNums)
    setExpression('')
    setUsedNumbers([])
    setTimeLeft(timePerRound)
    setFeedback(null)
    setHint(null)

    // 启动倒计时
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [timePerRound, generateSolvableNumbers])

  // 时间到了自动结束这轮
  useEffect(() => {
    if (timeLeft === 0 && isPlaying) {
      onRoundEnd?.(round, false)
      if (round >= totalRounds) {
        setIsPlaying(false)
        setIsFinished(true)
        onGameEnd?.(score)
      } else {
        setRound((r) => r + 1)
        startNewRound()
      }
    }
  }, [timeLeft, isPlaying, round, totalRounds, score, onRoundEnd, onGameEnd, startNewRound])

  // 开始游戏
  const startGame = useCallback(() => {
    clearTimers()
    setScore(0)
    setRound(1)
    setIsPlaying(true)
    setIsFinished(false)
    startNewRound()
  }, [clearTimers, startNewRound])

  // 点击数字卡片
  const handleNumberClick = useCallback(
    (num: number) => {
      if (!isPlaying || feedback) return
      if (canUseNumber(num, usedNumbers, numbers)) {
        setExpression((prev) => prev + num)
        setUsedNumbers((prev) => [...prev, num])
      }
    },
    [isPlaying, feedback, usedNumbers, numbers],
  )

  // 输入运算符
  const handleOperator = useCallback(
    (op: string) => {
      if (!isPlaying || feedback) return
      setExpression((prev) => prev + op)
    },
    [isPlaying, feedback],
  )

  // 退格
  const handleBackspace = useCallback(() => {
    if (!isPlaying || feedback || !expression) return

    const lastChar = expression[expression.length - 1]
    setExpression((prev) => prev.slice(0, -1))

    // 如果删的是数字，从 usedNumbers 里移除
    if (/\d/.test(lastChar)) {
      // 处理多位数的情况
      let numStr = lastChar
      let i = expression.length - 2
      while (i >= 0 && /\d/.test(expression[i])) {
        numStr = expression[i] + numStr
        i--
      }
      // 只删最后一个字符，检查剩余表达式中的数字
      const newExpr = expression.slice(0, -1)
      setUsedNumbers(extractNumbers(newExpr))
    }
  }, [isPlaying, feedback, expression])

  // 清除
  const handleClear = useCallback(() => {
    if (!isPlaying || feedback) return
    setExpression('')
    setUsedNumbers([])
  }, [isPlaying, feedback])

  // 提交答案
  const handleSubmit = useCallback((): boolean => {
    if (!isPlaying || feedback) return false

    const result = checkAnswer(expression, usedNumbers, numbers)

    if (result.isCorrect) {
      setFeedback('success')
      const newScore = score + 1
      setScore(newScore)
      onRoundEnd?.(round, true)

      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null)
        if (round >= totalRounds) {
          setIsPlaying(false)
          setIsFinished(true)
          clearTimers()
          onGameEnd?.(newScore)
        } else {
          setRound((r) => r + 1)
          startNewRound()
        }
      }, 1500)

      return true
    } else {
      setFeedback('error')
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null)
      }, 800)
      return false
    }
  }, [isPlaying, feedback, expression, usedNumbers, numbers, score, round, totalRounds, onRoundEnd, onGameEnd, clearTimers, startNewRound])

  // 跳过
  const handleSkip = useCallback(() => {
    if (!isPlaying || feedback) return
    onRoundEnd?.(round, false)

    if (round >= totalRounds) {
      setIsPlaying(false)
      setIsFinished(true)
      clearTimers()
      onGameEnd?.(score)
    } else {
      setRound((r) => r + 1)
      startNewRound()
    }
  }, [isPlaying, feedback, round, totalRounds, score, onRoundEnd, onGameEnd, clearTimers, startNewRound])

  // 提示
  const handleHint = useCallback(() => {
    if (!isPlaying) return
    const solution = solveFirst24(numbers)
    setHint(solution)
  }, [isPlaying, numbers])

  // 用外部传入的数字开始一轮（联机用）
  const startRoundWithNumbers = useCallback((nums: number[]) => {
    setNumbers(nums)
    setExpression('')
    setUsedNumbers([])
    setTimeLeft(timePerRound)
    setFeedback(null)
    setHint(null)
    setIsPlaying(true)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [timePerRound])

  // 清理
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return {
    // 状态
    numbers,
    expression,
    usedNumbers,
    score,
    round,
    totalRounds,
    timeLeft,
    feedback,
    isPlaying,
    isFinished,
    hint,
    // 操作
    startGame,
    handleNumberClick,
    handleOperator,
    handleBackspace,
    handleClear,
    handleSubmit,
    handleSkip,
    handleHint,
    startRoundWithNumbers,
    setScore,
    setRound,
    setIsPlaying,
    setIsFinished,
  }
}
