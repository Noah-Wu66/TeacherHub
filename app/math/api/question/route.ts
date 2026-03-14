import { NextRequest, NextResponse } from 'next/server'
import { getGenerator } from '@/lib/math/generators'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const chapterId = searchParams.get('chapterId')

  if (!chapterId) {
    return NextResponse.json({ error: 'chapterId is required' }, { status: 400 })
  }

  const generator = getGenerator(chapterId)
  if (!generator) {
    return NextResponse.json({ error: 'Generator not found' }, { status: 404 })
  }

  try {
    const question = generator()
    return NextResponse.json(question)
  } catch (error) {
    console.error('Error generating question:', error)
    return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 })
  }
}

