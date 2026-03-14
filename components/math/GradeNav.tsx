import type { Grade } from '@/lib/math/types'

interface GradeNavProps {
  currentGrade: Grade
  onGradeChange: (grade: Grade) => void
}

const grades: { value: Grade; label: string }[] = [
  { value: 1, label: '一年级' },
  { value: 2, label: '二年级' },
  { value: 3, label: '三年级' },
  { value: 4, label: '四年级' },
  { value: 5, label: '五年级' },
  { value: 6, label: '六年级' },
]

export default function GradeNav({ currentGrade, onGradeChange }: GradeNavProps) {
  return (
    <nav className="flex justify-center flex-wrap mb-6 sm:mb-8 gap-2 sm:gap-2.5">
      {grades.map(({ value, label }) => (
        <button
          key={value}
          className={`grade-tab ${currentGrade === value ? 'active' : ''}`}
          onClick={() => onGradeChange(value)}
          aria-label={`选择${label}`}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

