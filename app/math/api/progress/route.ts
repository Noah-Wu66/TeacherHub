import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/ai-education/mongodb'
import { COLLECTIONS, MATH_PROGRESS_FIELDS } from '@/lib/ai-education/models'
import { requireAnyUser } from '@/lib/platform/auth'

const DEFAULT_PROGRESS = {
  totalQuestions: 0,
  correctAnswers: 0,
  streak: 0,
  maxStreak: 0,
  lastPlayed: null,
}

export async function GET(request: NextRequest) {
  const user = await requireAnyUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const grade = searchParams.get('grade')
  const chapter = searchParams.get('chapter')

  if (!grade || !chapter) {
    return NextResponse.json({ error: 'grade and chapter are required' }, { status: 400 })
  }

  const collection = await getCollection(COLLECTIONS.mathProgress)
  const progress = await collection.findOne({
    [MATH_PROGRESS_FIELDS.userId]: user._id,
    [MATH_PROGRESS_FIELDS.grade]: Number(grade),
    [MATH_PROGRESS_FIELDS.chapter]: chapter,
  })

  return NextResponse.json(progress ? {
    totalQuestions: progress[MATH_PROGRESS_FIELDS.totalQuestions] || 0,
    correctAnswers: progress[MATH_PROGRESS_FIELDS.correctAnswers] || 0,
    streak: progress[MATH_PROGRESS_FIELDS.streak] || 0,
    maxStreak: progress[MATH_PROGRESS_FIELDS.maxStreak] || 0,
    lastPlayed: progress[MATH_PROGRESS_FIELDS.lastPlayed] || null,
  } : DEFAULT_PROGRESS)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAnyUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { grade, chapter, isCorrect } = body

    if (!grade || !chapter || typeof isCorrect !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const collection = await getCollection(COLLECTIONS.mathProgress)
    const current = await collection.findOne({
      [MATH_PROGRESS_FIELDS.userId]: user._id,
      [MATH_PROGRESS_FIELDS.grade]: Number(grade),
      [MATH_PROGRESS_FIELDS.chapter]: chapter,
    })

    const next = {
      totalQuestions: (current?.[MATH_PROGRESS_FIELDS.totalQuestions] || 0) + 1,
      correctAnswers: (current?.[MATH_PROGRESS_FIELDS.correctAnswers] || 0) + (isCorrect ? 1 : 0),
      streak: isCorrect ? (current?.[MATH_PROGRESS_FIELDS.streak] || 0) + 1 : 0,
      maxStreak: Math.max(current?.[MATH_PROGRESS_FIELDS.maxStreak] || 0, isCorrect ? (current?.[MATH_PROGRESS_FIELDS.streak] || 0) + 1 : 0),
      lastPlayed: new Date().toISOString(),
    }

    await collection.updateOne(
      {
        [MATH_PROGRESS_FIELDS.userId]: user._id,
        [MATH_PROGRESS_FIELDS.grade]: Number(grade),
        [MATH_PROGRESS_FIELDS.chapter]: chapter,
      },
      {
        $set: {
          [MATH_PROGRESS_FIELDS.userId]: user._id,
          [MATH_PROGRESS_FIELDS.grade]: Number(grade),
          [MATH_PROGRESS_FIELDS.chapter]: chapter,
          [MATH_PROGRESS_FIELDS.totalQuestions]: next.totalQuestions,
          [MATH_PROGRESS_FIELDS.correctAnswers]: next.correctAnswers,
          [MATH_PROGRESS_FIELDS.streak]: next.streak,
          [MATH_PROGRESS_FIELDS.maxStreak]: next.maxStreak,
          [MATH_PROGRESS_FIELDS.lastPlayed]: next.lastPlayed,
          [MATH_PROGRESS_FIELDS.updatedAt]: new Date(),
        },
        $setOnInsert: {
          [MATH_PROGRESS_FIELDS.createdAt]: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json(next)
  } catch (error) {
    console.error('Error saving progress:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAnyUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const grade = Number(body?.grade)
    const chapter = String(body?.chapter || '')
    if (!grade || !chapter) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const collection = await getCollection(COLLECTIONS.mathProgress)
    await collection.deleteOne({
      [MATH_PROGRESS_FIELDS.userId]: user._id,
      [MATH_PROGRESS_FIELDS.grade]: grade,
      [MATH_PROGRESS_FIELDS.chapter]: chapter,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting progress:', error)
    return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 })
  }
}
