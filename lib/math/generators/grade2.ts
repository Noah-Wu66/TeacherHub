import type { Question, ChapterInfo } from '../types'
import { MathUtils } from '../utils'

const { randomInt } = MathUtils

export const grade2UpChapters: ChapterInfo[] = [
  { id: 'addsub', title: '100以内的加减法', emoji: '➕➖', inputType: 'number' },
  { id: 'multiplication', title: '表内乘法', emoji: '✖️', inputType: 'number' },
  { id: 'time', title: '认识时间', emoji: '⏰', inputType: 'text', placeholder: 'xx:xx' },
]

export const grade2DownChapters: ChapterInfo[] = [
  { id: 'division', title: '表内除法', emoji: '➗', inputType: 'number' },
  { id: 'mixedop', title: '混合运算', emoji: '🧮', inputType: 'number' },
  { id: 'rem-div', title: '有余数的除法', emoji: '🤔', inputType: 'text', placeholder: '商...余数' },
  { id: 'within10k', title: '万以内数的认识', emoji: '🔢', inputType: 'number' },
]

export const grade2Generators: Record<string, () => Question> = {
  addsub: () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    let n1: number, n2: number, answer: number

    if (op === '+') {
      n1 = randomInt(10, 89)
      n2 = randomInt(10, 100 - n1)
      answer = n1 + n2
    } else {
      n1 = randomInt(20, 100)
      n2 = randomInt(10, n1 - 1)
      answer = n1 - n2
    }
    return { question: `${n1} ${op} ${n2} = ?`, answer }
  },

  multiplication: () => {
    const n1 = randomInt(1, 9)
    const n2 = randomInt(1, 9)
    const answer = n1 * n2
    return { question: `${n1} × ${n2} = ?`, answer }
  },

  time: () => {
    const hour = randomInt(1, 12)
    const minute = randomInt(0, 11) * 5
    const minuteStr = minute.toString().padStart(2, '0')
    return {
      question: `时针指向${hour},分针指向${minute / 5},现在是几点几分?`,
      answer: `${hour}:${minuteStr}`,
    }
  },

  division: () => {
    const divisor = randomInt(2, 9)
    const quotient = randomInt(1, 9)
    const dividend = divisor * quotient
    return { question: `${dividend} ÷ ${divisor} = ?`, answer: quotient }
  },

  mixedop: () => {
    const types = [
      () => {
        const a = randomInt(1, 9)
        const b = randomInt(1, 9)
        const c = randomInt(1, 9)
        const answer = a + b * c
        return { question: `${a} + ${b} × ${c} = ?`, answer }
      },
      () => {
        const a = randomInt(10, 50)
        const b = randomInt(1, 9)
        const c = randomInt(1, 9)
        const answer = a - b * c
        return { question: `${a} - ${b} × ${c} = ?`, answer }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  'rem-div': () => {
    const divisor = randomInt(2, 9)
    const quotient = randomInt(1, 9)
    const remainder = randomInt(1, divisor - 1)
    const dividend = divisor * quotient + remainder
    return {
      question: `${dividend} ÷ ${divisor} = ?`,
      answer: `${quotient}...${remainder}`,
    }
  },

  within10k: () => {
    const types = [
      () => {
        const num = randomInt(1000, 9999)
        return { question: `${num}的千位是几?`, answer: Math.floor(num / 1000) }
      },
      () => {
        const num = randomInt(1000, 9999)
        return { question: `${num}的百位是几?`, answer: Math.floor((num % 1000) / 100) }
      },
      () => {
        const thousands = randomInt(1, 9)
        const hundreds = randomInt(0, 9)
        const tens = randomInt(0, 9)
        const ones = randomInt(0, 9)
        const answer = thousands * 1000 + hundreds * 100 + tens * 10 + ones
        return {
          question: `${thousands}个千、${hundreds}个百、${tens}个十、${ones}个一组成的数是多少?`,
          answer,
        }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },
}

