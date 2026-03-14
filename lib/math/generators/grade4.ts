import type { Question, ChapterInfo } from '../types'
import { MathUtils } from '../utils'

const { randomInt } = MathUtils

export const grade4UpChapters: ChapterInfo[] = [
  { id: 'largenum', title: '大数的认识', emoji: '🔢', inputType: 'number' },
  { id: 'angle', title: '角的度量', emoji: '📐', inputType: 'number' },
  { id: 'multiplication', title: '三位数乘两位数', emoji: '✖️', inputType: 'number' },
  { id: 'division', title: '除数是两位数的除法', emoji: '➗', inputType: 'text', placeholder: '商...余数' },
]

export const grade4DownChapters: ChapterInfo[] = [
  { id: 'fourops', title: '四则运算', emoji: '🧮', inputType: 'number' },
  { id: 'law', title: '运算律', emoji: '🔄', inputType: 'number' },
  { id: 'decimal', title: '小数的意义和性质', emoji: '🔢', inputType: 'number' },
  { id: 'decimal-calc', title: '小数的加法和减法', emoji: '➕➖', inputType: 'number' },
  { id: 'average', title: '平均数与条形统计图', emoji: '📊', inputType: 'number' },
]

export const grade4Generators: Record<string, () => Question> = {
  largenum: () => {
    const types = [
      () => {
        const num = randomInt(10000, 99999)
        return { question: `${num}的万位是几?`, answer: Math.floor(num / 10000) }
      },
      () => {
        const num = randomInt(100000, 999999)
        return { question: `${num}的十万位是几?`, answer: Math.floor(num / 100000) }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  angle: () => {
    const types = [
      () => {
        const angle1 = randomInt(30, 80)
        const angle2 = 90 - angle1
        return { question: `一个直角是90度,其中一个角是${angle1}度,另一个角是多少度?`, answer: angle2 }
      },
      () => {
        const angle = randomInt(2, 5) * 30
        return { question: `一个平角是180度,其中一个角是${angle}度,另一个角是多少度?`, answer: 180 - angle }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  multiplication: () => {
    const n1 = randomInt(100, 999)
    const n2 = randomInt(10, 99)
    const answer = n1 * n2
    return { question: `${n1} × ${n2} = ?`, answer }
  },

  division: () => {
    const divisor = randomInt(10, 99)
    const quotient = randomInt(10, 99)
    const remainder = randomInt(0, divisor - 1)
    const dividend = divisor * quotient + remainder
    const answer = remainder === 0 ? `${quotient}` : `${quotient}...${remainder}`
    return { question: `${dividend} ÷ ${divisor} = ?`, answer }
  },

  fourops: () => {
    const types = [
      () => {
        const a = randomInt(10, 50)
        const b = randomInt(2, 9)
        const c = randomInt(2, 9)
        const answer = a + b * c
        return { question: `${a} + ${b} × ${c} = ?`, answer }
      },
      () => {
        const a = randomInt(20, 100)
        const b = randomInt(2, 9)
        const c = randomInt(2, 9)
        const answer = a - b * c
        return { question: `${a} - ${b} × ${c} = ?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  law: () => {
    const types = [
      () => {
        const a = randomInt(10, 99)
        const b = randomInt(10, 99)
        const answer = a + b
        return { question: `${a} + ${b} = ${b} + ?`, answer: a }
      },
      () => {
        const a = randomInt(2, 9)
        const b = randomInt(2, 9)
        const answer = a * b
        return { question: `${a} × ${b} = ${b} × ?`, answer: a }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  decimal: () => {
    const whole = randomInt(1, 99)
    const decimal = randomInt(1, 99)
    const num = parseFloat(`${whole}.${decimal.toString().padStart(2, '0')}`)
    const types = [
      () => ({ question: `${num}的整数部分是多少?`, answer: whole }),
      () => ({ question: `${num}扩大10倍是多少?`, answer: parseFloat((num * 10).toFixed(2)) }),
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  'decimal-calc': () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    const n1 = parseFloat(`${randomInt(1, 99)}.${randomInt(1, 99)}`)
    const n2 = parseFloat(`${randomInt(1, op === '+' ? 50 : n1)}.${randomInt(1, 99)}`)
    const answer = op === '+' ? parseFloat((n1 + n2).toFixed(2)) : parseFloat((n1 - n2).toFixed(2))
    return { question: `${n1} ${op} ${n2} = ?`, answer }
  },

  average: () => {
    const count = randomInt(3, 5)
    const numbers = Array.from({ length: count }, () => randomInt(60, 100))
    const sum = numbers.reduce((a, b) => a + b, 0)
    const answer = parseFloat((sum / count).toFixed(1))
    return {
      question: `${numbers.join('、')}这${count}个数的平均数是多少?`,
      answer,
    }
  },
}

