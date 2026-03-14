import type { Question, ChapterInfo } from '../types'
import { MathUtils } from '../utils'

const { randomInt } = MathUtils

export const grade6UpChapters: ChapterInfo[] = [
  { id: 'fraction-mult', title: '分数乘法', emoji: '✖️', inputType: 'text', placeholder: 'a/b' },
  { id: 'fraction-div', title: '分数除法', emoji: '➗', inputType: 'text', placeholder: 'a/b' },
  { id: 'ratio', title: '比', emoji: '⚖️', inputType: 'text', placeholder: 'a:b' },
  { id: 'circle', title: '圆', emoji: '⭕', inputType: 'number' },
  { id: 'percent', title: '百分数', emoji: '💯', inputType: 'number' },
]

export const grade6DownChapters: ChapterInfo[] = [
  { id: 'negative', title: '负数', emoji: '➖', inputType: 'number' },
  { id: 'cylinder', title: '圆柱与圆锥', emoji: '🎩', inputType: 'number' },
  { id: 'proportion', title: '比例', emoji: '⚖️', inputType: 'number' },
  { id: 'statistics', title: '统计', emoji: '📊', inputType: 'number' },
]

export const grade6Generators: Record<string, () => Question> = {
  'fraction-mult': () => {
    const d1 = randomInt(2, 12)
    const n1 = randomInt(1, d1 - 1)
    const d2 = randomInt(2, 12)
    const n2 = randomInt(1, d2 - 1)

    const numerator = n1 * n2
    const denominator = d1 * d2
    const simplified = MathUtils.simplifyFraction(numerator, denominator)

    return {
      question: `${n1}/${d1} × ${n2}/${d2} = ?`,
      answer: `${simplified.numerator}/${simplified.denominator}`,
    }
  },

  'fraction-div': () => {
    const d1 = randomInt(2, 12)
    const n1 = randomInt(1, d1 - 1)
    const d2 = randomInt(2, 12)
    const n2 = randomInt(1, d2 - 1)

    const numerator = n1 * d2
    const denominator = d1 * n2
    const simplified = MathUtils.simplifyFraction(numerator, denominator)

    return {
      question: `${n1}/${d1} ÷ ${n2}/${d2} = ?`,
      answer: `${simplified.numerator}/${simplified.denominator}`,
    }
  },

  ratio: () => {
    const a = randomInt(2, 20)
    const b = randomInt(2, 20)
    const gcd = MathUtils.gcd(a, b)
    const simplifiedA = a / gcd
    const simplifiedB = b / gcd
    return {
      question: `将比 ${a}:${b} 化简`,
      answer: `${simplifiedA}:${simplifiedB}`,
    }
  },

  circle: () => {
    const types = [
      () => {
        const radius = randomInt(5, 20)
        const answer = parseFloat((2 * Math.PI * radius).toFixed(2))
        return { question: `圆的半径是${radius}厘米,周长是多少厘米?(π取3.14)`, answer }
      },
      () => {
        const radius = randomInt(5, 20)
        const answer = parseFloat((Math.PI * radius * radius).toFixed(2))
        return { question: `圆的半径是${radius}厘米,面积是多少平方厘米?(π取3.14)`, answer }
      },
      () => {
        const diameter = randomInt(10, 40)
        const answer = parseFloat((Math.PI * diameter).toFixed(2))
        return { question: `圆的直径是${diameter}米,周长是多少米?(π取3.14)`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  percent: () => {
    const types = [
      () => {
        const percent = randomInt(10, 90)
        const base = randomInt(100, 1000)
        const answer = parseFloat(((base * percent) / 100).toFixed(2))
        return { question: `${base}的${percent}%是多少?`, answer }
      },
      () => {
        const part = randomInt(10, 100)
        const whole = randomInt(part + 10, 200)
        const answer = parseFloat(((part / whole) * 100).toFixed(1))
        return { question: `${part}是${whole}的百分之几?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  negative: () => {
    const types = [
      () => {
        const a = randomInt(-20, -1)
        const b = randomInt(1, 20)
        const answer = a + b
        return { question: `${a} + ${b} = ?`, answer }
      },
      () => {
        const a = randomInt(1, 20)
        const b = randomInt(-20, -1)
        const answer = a + b
        return { question: `${a} + (${b}) = ?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  cylinder: () => {
    const types = [
      () => {
        const radius = randomInt(3, 10)
        const height = randomInt(5, 20)
        const answer = parseFloat((2 * Math.PI * radius * height + 2 * Math.PI * radius * radius).toFixed(2))
        return {
          question: `圆柱底面半径${radius}厘米,高${height}厘米,表面积是多少平方厘米?(π取3.14)`,
          answer,
        }
      },
      () => {
        const radius = randomInt(3, 10)
        const height = randomInt(5, 20)
        const answer = parseFloat((Math.PI * radius * radius * height).toFixed(2))
        return {
          question: `圆柱底面半径${radius}厘米,高${height}厘米,体积是多少立方厘米?(π取3.14)`,
          answer,
        }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  proportion: () => {
    const a = randomInt(2, 10)
    const b = randomInt(2, 10)
    const k = randomInt(2, 5)
    const c = a * k
    const d = b * k
    return {
      question: `${a}:${b} = ${c}:x, x = ?`,
      answer: d,
    }
  },

  statistics: () => {
    const count = randomInt(4, 6)
    const numbers = Array.from({ length: count }, () => randomInt(50, 100))
    const sum = numbers.reduce((a, b) => a + b, 0)
    const answer = parseFloat((sum / count).toFixed(1))
    return {
      question: `数据 ${numbers.join('、')} 的平均数是多少?`,
      answer,
    }
  },
}

