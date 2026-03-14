'use client'

import { useState, useEffect } from 'react'
import type { Question, ChapterInfo } from '@/lib/math/types'
import { MathUtils, ProgressTracker } from '@/lib/math/utils'

interface QuizSectionProps {
  chapter: ChapterInfo
  grade: number
  generator: () => Question
}

export default function QuizSection({ chapter, grade, generator }: QuizSectionProps) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null)
  const [progress, setProgress] = useState({ accuracy: 0, streak: 0, maxStreak: 0 })

  useEffect(() => {
    generateNewQuestion()
    updateProgressDisplay()
  }, [chapter.id, grade])

  const generateNewQuestion = () => {
    const newQuestion = generator()
    setQuestion(newQuestion)
    setUserAnswer('')
    setFeedback(null)
  }

  const updateProgressDisplay = () => {
    const prog = ProgressTracker.getProgress(grade, chapter.id)
    setProgress({
      accuracy: ProgressTracker.getAccuracy(grade, chapter.id),
      streak: prog.streak,
      maxStreak: prog.maxStreak,
    })
  }

  const handleSubmit = () => {
    if (!question || !userAnswer.trim()) return

    const isCorrect = MathUtils.checkAnswer(userAnswer, question.answer)
    const feedbackData = MathUtils.getFeedback(isCorrect, question.answer, userAnswer)
    
    setFeedback(feedbackData)
    ProgressTracker.updateProgress(grade, chapter.id, isCorrect)
    updateProgressDisplay()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!question) return null

  return (
    <section className="tool-section">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
        {chapter.emoji} {chapter.title}
      </h2>

      <div className="mb-3 text-xs sm:text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-1 justify-center">
        <span>准确率: {progress.accuracy}%</span>
        <span>连对: {progress.streak}</span>
        <span>最高: {progress.maxStreak}</span>
      </div>

      <div className="quiz">
        <div className="question-display">{question.question}</div>

        <input
          type={chapter.inputType || 'number'}
          className="quiz-input mb-3"
          placeholder={chapter.placeholder || '请输入答案'}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          aria-label="答案输入框"
        />

        <div className="flex gap-2 sm:gap-2 justify-center mb-3 flex-wrap">
          <button
            className="quiz-btn flex-1 sm:flex-initial"
            onClick={handleSubmit}
            aria-label="检查答案"
          >
            检查
          </button>
          <button
            className="quiz-btn flex-1 sm:flex-initial"
            onClick={generateNewQuestion}
            aria-label="换一题"
          >
            换一题
          </button>
        </div>

        {feedback && (
          <div className={`feedback ${feedback.isCorrect ? 'correct' : 'wrong'}`}>
            {feedback.message}
          </div>
        )}
      </div>
    </section>
  )
}

