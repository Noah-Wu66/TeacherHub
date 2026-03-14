import type { Question, ChapterInfo } from '../types'
import { MathUtils } from '../utils'

const { randomInt } = MathUtils

export const grade3UpChapters: ChapterInfo[] = [
  { id: 'time', title: '时、分、秒', emoji: '⏰', inputType: 'text' },
  { id: 'addsub', title: '万以内的加法和减法', emoji: '➕➖', inputType: 'number' },
  { id: 'multiple', title: '倍的认识', emoji: '✖️', inputType: 'number' },
  { id: 'multiplication', title: '多位数乘一位数', emoji: '✖️', inputType: 'number' },
  { id: 'rectangle', title: '长方形和正方形', emoji: '⬜', inputType: 'number' },
  { id: 'fraction', title: '分数的初步认识', emoji: '🔗', inputType: 'text', placeholder: 'a/b' },
]

export const grade3DownChapters: ChapterInfo[] = [
  { id: 'division', title: '除数是一位数的除法', emoji: '➗', inputType: 'text', placeholder: '商...余数' },
  { id: 'multiplication2', title: '两位数乘两位数', emoji: '✖️', inputType: 'number' },
  { id: 'area', title: '面积', emoji: '📐', inputType: 'number' },
  { id: 'decimal', title: '小数的初步认识', emoji: '🔢', inputType: 'number' },
]

export const grade3Generators: Record<string, () => Question> = {
  time: () => {
    const types = [
      () => {
        const minutes = randomInt(1, 10)
        return { question: `${minutes}分 = 多少秒?`, answer: minutes * 60 }
      },
      () => {
        const seconds = randomInt(2, 10) * 60
        return { question: `${seconds}秒 = 多少分?`, answer: seconds / 60 }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  addsub: () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    let n1: number, n2: number, answer: number

    if (op === '+') {
      n1 = randomInt(100, 8999)
      n2 = randomInt(100, 10000 - n1)
      answer = n1 + n2
    } else {
      n1 = randomInt(200, 10000)
      n2 = randomInt(100, n1 - 1)
      answer = n1 - n2
    }
    return { question: `${n1} ${op} ${n2} = ?`, answer }
  },

  multiple: () => {
    const base = randomInt(5, 20)
    const times = randomInt(2, 9)
    const answer = base * times
    return { question: `${base}的${times}倍是多少?`, answer }
  },

  multiplication: () => {
    const n1 = randomInt(10, 999)
    const n2 = randomInt(2, 9)
    const answer = n1 * n2
    return { question: `${n1} × ${n2} = ?`, answer }
  },

  rectangle: () => {
    const types = [
      () => {
        const length = randomInt(5, 20)
        const width = randomInt(3, length - 1)
        const answer = 2 * (length + width)
        return { question: `长方形长${length}厘米,宽${width}厘米,周长是多少厘米?`, answer }
      },
      () => {
        const side = randomInt(5, 20)
        const answer = 4 * side
        return { question: `正方形边长${side}厘米,周长是多少厘米?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  fraction: () => {
    const denominator = randomInt(2, 12)
    const numerator = randomInt(1, denominator - 1)
    const simplified = MathUtils.simplifyFraction(numerator, denominator)
    return {
      question: `把一个整体平均分成${denominator}份,取其中${numerator}份,用分数表示是?`,
      answer: `${simplified.numerator}/${simplified.denominator}`,
    }
  },

  division: () => {
    const divisor = randomInt(2, 9)
    const quotient = randomInt(10, 99)
    const remainder = randomInt(0, divisor - 1)
    const dividend = divisor * quotient + remainder
    const answer = remainder === 0 ? `${quotient}` : `${quotient}...${remainder}`
    return { question: `${dividend} ÷ ${divisor} = ?`, answer }
  },

  multiplication2: () => {
    const n1 = randomInt(10, 99)
    const n2 = randomInt(10, 99)
    const answer = n1 * n2
    return { question: `${n1} × ${n2} = ?`, answer }
  },

  area: () => {
    const types = [
      () => {
        const length = randomInt(5, 20)
        const width = randomInt(3, length - 1)
        const answer = length * width
        return { question: `长方形长${length}米,宽${width}米,面积是多少平方米?`, answer }
      },
      () => {
        const side = randomInt(5, 20)
        const answer = side * side
        return { question: `正方形边长${side}米,面积是多少平方米?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  decimal: () => {
    const types = [
      () => {
        const whole = randomInt(1, 9)
        const decimal = randomInt(1, 9)
        const answer = parseFloat(`${whole}.${decimal}`)
        return { question: `${whole}元${decimal}角用小数表示是多少元?`, answer }
      },
      () => {
        const num = parseFloat(`${randomInt(1, 9)}.${randomInt(1, 9)}`)
        const answer = Math.floor(num)
        return { question: `${num}的整数部分是多少?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },
}

