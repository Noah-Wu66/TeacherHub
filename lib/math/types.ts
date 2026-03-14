export type Grade = 1 | 2 | 3 | 4 | 5 | 6
export type Semester = 'up' | 'down'

export interface Question {
  question: string
  answer: number | string
  hint?: string
}

export interface Progress {
  totalQuestions: number
  correctAnswers: number
  streak: number
  maxStreak: number
  lastPlayed: string | null
}

export interface GameConfig {
  questionId: string
  answerId: string
  submitId: string
  nextId: string
  feedbackId: string
  generator: () => Question
}

export interface Feedback {
  message: string
  isCorrect: boolean
  hint?: string
}

export interface ChapterInfo {
  id: string
  title: string
  emoji: string
  inputType?: 'number' | 'text'
  placeholder?: string
}

