// ============================================
// 24点求解器 — 穷举所有可能的表达式
// ============================================

const OPERATORS = ['+', '-', '*', '/'] as const

interface Solution {
  expression: string
  value: number
}

/**
 * 求解 24 点，返回所有可能的解法
 */
export function solve24(numbers: number[]): string[] {
  const solutions = new Set<string>()
  findSolutions(numbers.map((n) => ({ val: n, expr: String(n) })), solutions)
  return Array.from(solutions)
}

/**
 * 求解 24 点，只返回第一个解法（更快）
 */
export function solveFirst24(numbers: number[]): string | null {
  const result = { found: false, expression: '' }
  findFirst(numbers.map((n) => ({ val: n, expr: String(n) })), result)
  return result.found ? result.expression : null
}

/**
 * 检查给定数字是否有解
 */
export function hasSolution(numbers: number[]): boolean {
  return solveFirst24(numbers) !== null
}

// --- 内部实现 ---

interface NumExpr {
  val: number
  expr: string
}

function findSolutions(nums: NumExpr[], solutions: Set<string>): void {
  if (nums.length === 1) {
    if (Math.abs(nums[0].val - 24) < 1e-9) {
      solutions.add(nums[0].expr)
    }
    return
  }

  // 选两个数进行运算
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue

      const remaining = nums.filter((_, k) => k !== i && k !== j)
      const a = nums[i]
      const b = nums[j]

      for (const op of OPERATORS) {
        const combined = combine(a, b, op)
        if (combined === null) continue
        findSolutions([...remaining, combined], solutions)
      }
    }
  }
}

function findFirst(nums: NumExpr[], result: { found: boolean; expression: string }): void {
  if (result.found) return

  if (nums.length === 1) {
    if (Math.abs(nums[0].val - 24) < 1e-9) {
      result.found = true
      result.expression = nums[0].expr
    }
    return
  }

  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue
      if (result.found) return

      const remaining = nums.filter((_, k) => k !== i && k !== j)
      const a = nums[i]
      const b = nums[j]

      for (const op of OPERATORS) {
        if (result.found) return
        const combined = combine(a, b, op)
        if (combined === null) continue
        findFirst([...remaining, combined], result)
      }
    }
  }
}

function combine(a: NumExpr, b: NumExpr, op: string): NumExpr | null {
  let val: number
  let expr: string

  const aExpr = needsParens(a.expr, op, 'left') ? `(${a.expr})` : a.expr
  const bExpr = needsParens(b.expr, op, 'right') ? `(${b.expr})` : b.expr

  switch (op) {
    case '+':
      val = a.val + b.val
      expr = `${aExpr} + ${bExpr}`
      break
    case '-':
      val = a.val - b.val
      expr = `${aExpr} - ${bExpr}`
      break
    case '*':
      val = a.val * b.val
      expr = `${aExpr} × ${bExpr}`
      break
    case '/':
      if (Math.abs(b.val) < 1e-9) return null
      val = a.val / b.val
      expr = `${aExpr} ÷ ${bExpr}`
      break
    default:
      return null
  }

  return { val, expr }
}

function needsParens(expr: string, parentOp: string, side: 'left' | 'right'): boolean {
  // 单个数字不需要括号
  if (/^\d+$/.test(expr)) return false

  const hasAddSub = /[+\-]/.test(expr.replace(/^\(.*\)$/, ''))

  // 乘除运算中，加减子表达式需要括号
  if ((parentOp === '*' || parentOp === '/') && hasAddSub) return true

  // 减法右侧的加减需要括号
  if (parentOp === '-' && side === 'right' && hasAddSub) return true

  // 除法右侧的乘除需要括号
  if (parentOp === '/' && side === 'right' && /[×÷*/]/.test(expr)) return true

  return false
}
