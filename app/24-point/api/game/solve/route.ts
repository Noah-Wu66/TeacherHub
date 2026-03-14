import { NextRequest, NextResponse } from 'next/server'
import { solveFirst24 } from '@/lib/24-point/solver'

// POST — 自动解题（提示功能）
export async function POST(request: NextRequest) {
  try {
    const { numbers } = await request.json()

    if (!numbers || !Array.isArray(numbers) || numbers.length !== 4) {
      return NextResponse.json({ error: '需要4个数字' }, { status: 400 })
    }

    const solution = solveFirst24(numbers)

    return NextResponse.json({
      hasSolution: !!solution,
      solution,
    })
  } catch (error) {
    console.error('解题失败:', error)
    return NextResponse.json({ error: '解题失败' }, { status: 500 })
  }
}
