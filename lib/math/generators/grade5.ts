import type { Question, ChapterInfo } from '../types'
import { MathUtils } from '../utils'

const { randomInt } = MathUtils

export const grade5UpChapters: ChapterInfo[] = [
  { id: 'decimal-mult', title: '小数乘法', emoji: '✖️', inputType: 'number' },
  { id: 'position', title: '位置', emoji: '🧭', inputType: 'text', placeholder: '(列,行)' },
  { id: 'decimal-div', title: '小数除法', emoji: '➗', inputType: 'number' },
  { id: 'equation', title: '简易方程', emoji: '🅰️', inputType: 'number' },
  { id: 'polygon', title: '多边形的面积', emoji: '📐', inputType: 'number' },
]

export const grade5DownChapters: ChapterInfo[] = [
  { id: 'factor', title: '因数和倍数', emoji: '🔢', inputType: 'text', placeholder: '用逗号分隔' },
  { id: 'cuboid', title: '长方体和正方体', emoji: '📦', inputType: 'number' },
  { id: 'fraction', title: '分数的意义和性质', emoji: '🔗', inputType: 'text', placeholder: 'a/b' },
  { id: 'fraction-calc', title: '分数的加法和减法', emoji: '➕➖', inputType: 'text', placeholder: 'a/b' },
]

export const grade5Generators: Record<string, () => Question> = {
  'decimal-mult': () => {
    const n1 = parseFloat(`${randomInt(1, 99)}.${randomInt(1, 9)}`)
    const n2 = parseFloat(`${randomInt(1, 9)}.${randomInt(1, 9)}`)
    const answer = parseFloat((n1 * n2).toFixed(2))
    return { question: `${n1} × ${n2} = ?`, answer }
  },

  position: () => {
    const col = randomInt(1, 10)
    const row = randomInt(1, 10)
    return {
      question: `小明坐在第${col}列第${row}行,用数对表示是?`,
      answer: `(${col},${row})`,
    }
  },

  'decimal-div': () => {
    const divisor = parseFloat(`${randomInt(1, 9)}.${randomInt(1, 9)}`)
    const quotient = randomInt(2, 20)
    const dividend = parseFloat((divisor * quotient).toFixed(2))
    return { question: `${dividend} ÷ ${divisor} = ?`, answer: quotient }
  },

  equation: () => {
    const types = [
      () => {
        const x = randomInt(5, 50)
        const b = randomInt(5, 50)
        const c = x + b
        return { question: `x + ${b} = ${c}`, answer: x }
      },
      () => {
        const x = randomInt(10, 100)
        const b = randomInt(5, x - 1)
        const c = x - b
        return { question: `x - ${b} = ${c}`, answer: x }
      },
      () => {
        const x = randomInt(5, 20)
        const b = randomInt(2, 9)
        const c = x * b
        return { question: `${b}x = ${c}`, answer: x }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  polygon: () => {
    const types = [
      () => {
        const base = randomInt(5, 20)
        const height = randomInt(5, 20)
        const answer = (base * height) / 2
        return { question: `三角形底${base}厘米,高${height}厘米,面积是多少平方厘米?`, answer }
      },
      () => {
        const base = randomInt(5, 20)
        const height = randomInt(5, 20)
        const answer = base * height
        return { question: `平行四边形底${base}米,高${height}米,面积是多少平方米?`, answer }
      },
      () => {
        const upperBase = randomInt(5, 15)
        const lowerBase = randomInt(upperBase + 1, 20)
        const height = randomInt(5, 15)
        const answer = ((upperBase + lowerBase) * height) / 2
        return {
          question: `梯形上底${upperBase}米,下底${lowerBase}米,高${height}米,面积是多少平方米?`,
          answer,
        }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  factor: () => {
    const num = randomInt(6, 20)
    const factors: number[] = []
    for (let i = 1; i <= num; i++) {
      if (num % i === 0) {
        factors.push(i)
      }
    }
    return {
      question: `${num}的所有因数是?(用逗号分隔)`,
      answer: factors.join(','),
    }
  },

  cuboid: () => {
    const types = [
      () => {
        const length = randomInt(5, 20)
        const width = randomInt(3, length - 1)
        const height = randomInt(3, width)
        const answer = 2 * (length * width + length * height + width * height)
        return {
          question: `长方体长${length}厘米,宽${width}厘米,高${height}厘米,表面积是多少平方厘米?`,
          answer,
        }
      },
      () => {
        const edge = randomInt(5, 15)
        const answer = 6 * edge * edge
        return { question: `正方体棱长${edge}厘米,表面积是多少平方厘米?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  fraction: () => {
    const denominator = randomInt(2, 12)
    const numerator = randomInt(1, denominator * 2)
    const simplified = MathUtils.simplifyFraction(numerator, denominator)
    return {
      question: `将分数 ${numerator}/${denominator} 化简`,
      answer: `${simplified.numerator}/${simplified.denominator}`,
    }
  },

  'fraction-calc': () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    const denominator = randomInt(2, 12)
    let n1 = randomInt(1, denominator - 1)
    let n2 = randomInt(1, denominator - 1)

    let numerator: number
    if (op === '+') {
      numerator = n1 + n2
    } else {
      if (n1 < n2) {
        [n1, n2] = [n2, n1]
      }
      numerator = n1 - n2
    }

    const simplified = MathUtils.simplifyFraction(numerator, denominator)
    return {
      question: `${n1}/${denominator} ${op} ${n2}/${denominator} = ?`,
      answer: `${simplified.numerator}/${simplified.denominator}`,
    }
  },
}

