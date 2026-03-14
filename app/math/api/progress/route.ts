import { NextRequest, NextResponse } from 'next/server'

// 这个API端点预留用于未来的服务器端进度保存功能
// 当前版本使用 localStorage,未来可以扩展为数据库存储

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const grade = searchParams.get('grade')
  const chapter = searchParams.get('chapter')

  if (!grade || !chapter) {
    return NextResponse.json({ error: 'grade and chapter are required' }, { status: 400 })
  }

  // TODO: 从数据库获取进度
  return NextResponse.json({
    message: 'Progress retrieval not implemented yet. Use localStorage for now.',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { grade, chapter, isCorrect } = body

    if (!grade || !chapter || typeof isCorrect !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // TODO: 保存进度到数据库
    return NextResponse.json({
      message: 'Progress saved successfully',
      // 返回更新后的进度
    })
  } catch (error) {
    console.error('Error saving progress:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}

