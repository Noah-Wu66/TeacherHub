import type { Progress, Feedback } from './types'

export class MathUtils {
  // 生成随机整数
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // 计算最大公约数
  static gcd(a: number, b: number): number {
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    return a
  }

  // 简化分数
  static simplifyFraction(numerator: number, denominator: number): { numerator: number; denominator: number } {
    const gcdValue = this.gcd(Math.abs(numerator), Math.abs(denominator))
    return {
      numerator: numerator / gcdValue,
      denominator: denominator / gcdValue,
    }
  }

  // 格式化分数字符串
  static formatFraction(numerator: number, denominator: number): string {
    const simplified = this.simplifyFraction(numerator, denominator)
    return `${simplified.numerator}/${simplified.denominator}`
  }

  // 生成随机分数
  static randomFraction(maxDenominator: number = 10): { numerator: number; denominator: number } {
    const denominator = this.randomInt(2, maxDenominator)
    const numerator = this.randomInt(1, denominator - 1)
    return this.simplifyFraction(numerator, denominator)
  }

  // 检查答案是否正确
  static checkAnswer(userAnswer: string | number, correctAnswer: string | number, tolerance: number = 0.01): boolean {
    if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    }
    
    const userNum = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer
    const correctNum = typeof correctAnswer === 'string' ? parseFloat(correctAnswer) : correctAnswer
    
    if (isNaN(userNum) || isNaN(correctNum)) {
      return false
    }
    
    return Math.abs(userNum - correctNum) <= tolerance
  }

  // 获取反馈信息
  static getFeedback(isCorrect: boolean, correctAnswer: string | number, userAnswer?: string | number): Feedback {
    if (isCorrect) {
      const positiveMessages = [
        '太棒了!🎉',
        '完全正确!👏',
        '真聪明!⭐',
        '答对了!🌟',
        '很好!继续加油!💪',
      ]
      return {
        message: positiveMessages[this.randomInt(0, positiveMessages.length - 1)],
        isCorrect: true,
      }
    } else {
      return {
        message: `不对哦,正确答案是 ${correctAnswer}。再试一次吧!`,
        isCorrect: false,
        hint: '仔细想想计算步骤哦!',
      }
    }
  }
}

export class ProgressTracker {
  static getKey(grade: number, chapter: string) {
    return `progress_${grade}_${chapter}`
  }

  static async syncFromServer(grade: number, chapter: string): Promise<Progress> {
    const key = this.getKey(grade, chapter)
    const defaultProgress: Progress = this.getProgress(grade, chapter)

    if (typeof window === 'undefined') {
      return defaultProgress
    }

    try {
      const response = await fetch(`/math/api/progress?grade=${grade}&chapter=${encodeURIComponent(chapter)}`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        return defaultProgress
      }
      const progress = await response.json()
      localStorage.setItem(key, JSON.stringify(progress))
      return progress
    } catch {
      return defaultProgress
    }
  }

  // 获取进度数据
  static getProgress(grade: number, chapter: string): Progress {
    const key = this.getKey(grade, chapter)
    const defaultProgress: Progress = {
      totalQuestions: 0,
      correctAnswers: 0,
      streak: 0,
      maxStreak: 0,
      lastPlayed: null,
    }

    if (typeof window === 'undefined') {
      return defaultProgress
    }

    try {
      const stored = localStorage.getItem(key)
      if (!stored) return defaultProgress

      const progress = JSON.parse(stored) as Progress
      return {
        totalQuestions: progress.totalQuestions || 0,
        correctAnswers: progress.correctAnswers || 0,
        streak: progress.streak || 0,
        maxStreak: progress.maxStreak || 0,
        lastPlayed: progress.lastPlayed || null,
      }
    } catch (error) {
      console.warn('Failed to parse progress data:', error)
      return defaultProgress
    }
  }

  // 更新进度数据
  static updateProgress(grade: number, chapter: string, isCorrect: boolean): Progress {
    const key = this.getKey(grade, chapter)
    const progress = this.getProgress(grade, chapter)

    progress.totalQuestions++

    if (isCorrect) {
      progress.correctAnswers++
      progress.streak++
      progress.maxStreak = Math.max(progress.maxStreak, progress.streak)
    } else {
      progress.streak = 0
    }

    progress.lastPlayed = new Date().toISOString()

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(progress))
        void fetch('/math/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade, chapter, isCorrect }),
        }).then(async (response) => {
          if (!response.ok) return
          const serverProgress = await response.json()
          localStorage.setItem(key, JSON.stringify(serverProgress))
        }).catch(() => undefined)
      } catch (error) {
        console.warn('Failed to save progress data:', error)
      }
    }

    return progress
  }

  // 获取准确率
  static getAccuracy(grade: number, chapter: string): number {
    const progress = this.getProgress(grade, chapter)
    if (progress.totalQuestions === 0) {
      return 0
    }
    return parseFloat((progress.correctAnswers / progress.totalQuestions * 100).toFixed(1))
  }

  // 重置进度
  static resetProgress(grade: number, chapter: string): boolean {
    const key = this.getKey(grade, chapter)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key)
        void fetch('/math/api/progress', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade, chapter }),
        }).catch(() => undefined)
        return true
      } catch (error) {
        console.warn('Failed to reset progress:', error)
        return false
      }
    }
    return false
  }
}
