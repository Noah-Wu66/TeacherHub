import type { Semester } from '@/lib/math/types'

interface SemesterNavProps {
  currentSemester: Semester
  onSemesterChange: (semester: Semester) => void
}

export default function SemesterNav({ currentSemester, onSemesterChange }: SemesterNavProps) {
  return (
    <div className="flex justify-center gap-3 sm:gap-2.5 mb-4 sm:mb-5">
      <button
        className={`semester-tab ${currentSemester === 'up' ? 'active' : ''}`}
        onClick={() => onSemesterChange('up')}
        aria-label="选择上册"
      >
        上册
      </button>
      <button
        className={`semester-tab ${currentSemester === 'down' ? 'active' : ''}`}
        onClick={() => onSemesterChange('down')}
        aria-label="选择下册"
      >
        下册
      </button>
    </div>
  )
}

