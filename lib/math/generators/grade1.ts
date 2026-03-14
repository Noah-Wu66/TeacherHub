import type { Question, ChapterInfo } from '../types'
import { MathUtils } from '../utils'

const { randomInt } = MathUtils

export const grade1UpChapters: ChapterInfo[] = [
  { id: 'within5', title: '5以内数的认识和加减法', emoji: '🔢', inputType: 'number' },
  { id: '6to10', title: '6~10的认识和加减法', emoji: '🔟', inputType: 'number' },
  { id: 'carry-add', title: '20以内的进位加法', emoji: '➕', inputType: 'number' },
]

export const grade1DownChapters: ChapterInfo[] = [
  { id: 'borrow-sub', title: '20以内的退位减法', emoji: '➖', inputType: 'number' },
  { id: 'within100', title: '100以内的数的认识', emoji: '💯', inputType: 'number' },
  { id: 'mental-calc', title: '100以内的口算加减法', emoji: '🧮', inputType: 'number' },
  { id: 'written-calc', title: '100以内的笔算加减法', emoji: '📝', inputType: 'number' },
]

export const grade1Generators: Record<string, () => Question> = {
  within5: () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    let n1: number, n2: number, answer: number

    if (op === '+') {
      n1 = randomInt(1, 4)
      n2 = randomInt(1, 5 - n1)
      answer = n1 + n2
    } else {
      n1 = randomInt(2, 5)
      n2 = randomInt(1, n1)
      answer = n1 - n2
    }
    return { question: `${n1} ${op} ${n2} = ?`, answer }
  },

  '6to10': () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    let n1: number, n2: number, answer: number

    if (op === '+') {
      n1 = randomInt(1, 9)
      n2 = randomInt(1, 10 - n1)
      answer = n1 + n2
    } else {
      n1 = randomInt(6, 10)
      n2 = randomInt(1, n1)
      answer = n1 - n2
    }
    return { question: `${n1} ${op} ${n2} = ?`, answer }
  },

  'carry-add': () => {
    const n1 = randomInt(2, 9)
    const n2 = randomInt(11 - n1, 9)
    const answer = n1 + n2
    return { question: `${n1} + ${n2} = ?`, answer }
  },

  'borrow-sub': () => {
    const answer = randomInt(1, 9)
    const n1 = randomInt(11, 20)
    const n2 = n1 - answer
    return { question: `${n1} - ${n2} = ?`, answer }
  },

  within100: () => {
    const types = [
      () => {
        const num = randomInt(10, 99)
        return { question: `${num}的个位是几?`, answer: num % 10 }
      },
      () => {
        const num = randomInt(10, 99)
        return { question: `${num}的十位是几?`, answer: Math.floor(num / 10) }
      },
      () => {
        const tens = randomInt(1, 9)
        const ones = randomInt(0, 9)
        return { question: `${tens}个十和${ones}个一组成的数是多少?`, answer: tens * 10 + ones }
      },
    ]
    return types[randomInt(0, types.length - 1)]()
  },

  'mental-calc': () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    let n1: number, n2: number, answer: number

    if (op === '+') {
      n1 = randomInt(10, 89)
      n2 = randomInt(1, 100 - n1)
      answer = n1 + n2
    } else {
      n1 = randomInt(11, 100)
      n2 = randomInt(1, n1)
      answer = n1 - n2
    }
    return { question: `${n1} ${op} ${n2} = ?`, answer }
  },

  'written-calc': () => {
    const operations = ['+', '-']
    const op = operations[randomInt(0, 1)]
    let n1: number, n2: number, answer: number

    if (op === '+') {
      n1 = randomInt(20, 89)
      n2 = randomInt(10, 100 - n1)
      answer = n1 + n2
    } else {
      n1 = randomInt(30, 100)
      n2 = randomInt(10, n1 - 1)
      answer = n1 - n2
    }
    return { question: `${n1} ${op} ${n2} = ?`, answer }
  },
}

