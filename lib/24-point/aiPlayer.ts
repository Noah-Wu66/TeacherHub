// ============================================
// AI 玩家逻辑
// ============================================

import { solveFirst24 } from './solver'
import type { AiDifficulty } from '@/types/24-point'
import { AI_CONFIG } from '@/types/24-point'

type ResolvedAiDifficulty = Exclude<AiDifficulty, 'adaptive'>

export interface AdaptiveAiContext {
  playerScore: number
  aiScore: number
  round: number
  totalRounds: number
}

export interface AiAction {
  willSolve: boolean
  expression: string | null
  thinkTime: number   // 毫秒
}

export function resolveAiDifficulty(
  difficulty: AiDifficulty,
  context?: AdaptiveAiContext,
): ResolvedAiDifficulty {
  if (difficulty !== 'adaptive') {
    return difficulty
  }

  if (!context) {
    return 'normal'
  }

  const completedRounds = Math.max(context.round - 1, 0)
  const successRate = completedRounds > 0 ? context.playerScore / completedRounds : 0.5
  const scoreDiff = context.playerScore - context.aiScore
  const lateGame = context.round >= Math.max(3, Math.ceil(context.totalRounds * 0.6))

  if (scoreDiff >= 2 || successRate >= 0.8 || (lateGame && scoreDiff >= 1)) {
    return 'hard'
  }

  if (scoreDiff <= -2 || successRate <= 0.35 || (lateGame && scoreDiff < 0)) {
    return 'easy'
  }

  return 'normal'
}

/**
 * AI 决定本轮的行为
 */
export function getAiAction(
  numbers: number[],
  difficulty: AiDifficulty,
  context?: AdaptiveAiContext,
): AiAction {
  const resolvedDifficulty = resolveAiDifficulty(difficulty, context)
  const config = AI_CONFIG[resolvedDifficulty]

  // 随机思考时间
  const thinkTime = config.minTime + Math.random() * (config.maxTime - config.minTime)

  // 根据正确率决定是否答对
  const willSolve = Math.random() < config.accuracy

  if (!willSolve) {
    return {
      willSolve: false,
      expression: null,
      thinkTime,
    }
  }

  // 尝试求解
  const solution = solveFirst24(numbers)

  if (!solution) {
    // 无解题目，AI 也不会答
    return {
      willSolve: false,
      expression: null,
      thinkTime,
    }
  }

  return {
    willSolve: true,
    expression: solution,
    thinkTime,
  }
}

/**
 * 生成 AI "思考中" 的假输入过程
 * 返回一系列中间状态的表达式，用于动画展示
 */
export function generateThinkingSteps(finalExpression: string): string[] {
  const steps: string[] = []
  const chars = finalExpression.split('')

  let current = ''
  for (const char of chars) {
    current += char
    // 不是每个字符都加，模拟人类输入的节奏
    if (char !== ' ' && Math.random() > 0.3) {
      steps.push(current)
    }
  }

  // 确保最后一步是完整表达式
  if (steps[steps.length - 1] !== finalExpression) {
    steps.push(finalExpression)
  }

  return steps
}
