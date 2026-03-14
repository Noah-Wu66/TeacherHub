'use client'

import { useState } from 'react'
import Header from '@/components/math/Header'
import GradeNav from '@/components/math/GradeNav'
import SemesterNav from '@/components/math/SemesterNav'
import GradeContent from '@/components/math/GradeContent'
import type { Grade, Semester } from '@/lib/math/types'

export default function Home() {
  const [currentGrade, setCurrentGrade] = useState<Grade>(1)
  const [currentSemester, setCurrentSemester] = useState<Semester>('up')

  return (
    <div className="container-main">
      <Header />
      <GradeNav currentGrade={currentGrade} onGradeChange={setCurrentGrade} />
      <SemesterNav currentSemester={currentSemester} onSemesterChange={setCurrentSemester} />
      <main>
        <GradeContent grade={currentGrade} semester={currentSemester} />
      </main>
    </div>
  )
}

