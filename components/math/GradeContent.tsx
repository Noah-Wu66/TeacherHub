'use client'

import type { Grade, Semester } from '@/lib/math/types'
import { getChapters, getGenerator } from '@/lib/math/generators'
import QuizSection from './QuizSection'

interface GradeContentProps {
  grade: Grade
  semester: Semester
}

export default function GradeContent({ grade, semester }: GradeContentProps) {
  const chapters = getChapters(grade, semester)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
      {chapters.map((chapter) => {
        const generator = getGenerator(chapter.id)
        if (!generator) {
          console.warn(`No generator found for chapter: ${chapter.id}`)
          return null
        }

        return (
          <QuizSection
            key={`${grade}-${semester}-${chapter.id}`}
            chapter={chapter}
            grade={grade}
            generator={generator}
          />
        )
      })}
    </div>
  )
}

