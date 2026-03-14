import type { Grade, Semester, ChapterInfo, Question } from '../types'
import { grade1UpChapters, grade1DownChapters, grade1Generators } from './grade1'
import { grade2UpChapters, grade2DownChapters, grade2Generators } from './grade2'
import { grade3UpChapters, grade3DownChapters, grade3Generators } from './grade3'
import { grade4UpChapters, grade4DownChapters, grade4Generators } from './grade4'
import { grade5UpChapters, grade5DownChapters, grade5Generators } from './grade5'
import { grade6UpChapters, grade6DownChapters, grade6Generators } from './grade6'

export const chaptersMap: Record<Grade, Record<Semester, ChapterInfo[]>> = {
  1: { up: grade1UpChapters, down: grade1DownChapters },
  2: { up: grade2UpChapters, down: grade2DownChapters },
  3: { up: grade3UpChapters, down: grade3DownChapters },
  4: { up: grade4UpChapters, down: grade4DownChapters },
  5: { up: grade5UpChapters, down: grade5DownChapters },
  6: { up: grade6UpChapters, down: grade6DownChapters },
}

export const generatorsMap: Record<string, () => Question> = {
  ...grade1Generators,
  ...grade2Generators,
  ...grade3Generators,
  ...grade4Generators,
  ...grade5Generators,
  ...grade6Generators,
}

export function getChapters(grade: Grade, semester: Semester): ChapterInfo[] {
  return chaptersMap[grade]?.[semester] || []
}

export function getGenerator(chapterId: string): (() => Question) | undefined {
  return generatorsMap[chapterId]
}

