// ============================================
// 24点核心游戏逻辑
// ============================================

/**
 * 生成 4 个 1-13 的随机数字
 */
export function generateNumbers(): number[] {
  const nums: number[] = []
  for (let i = 0; i < 4; i++) {
    nums.push(Math.floor(Math.random() * 13) + 1)
  }
  return nums
}

/**
 * 检查某个数字是否还能使用
 */
export function canUseNumber(
  value: number,
  usedNumbers: number[],
  currentNumbers: number[],
): boolean {
  const countUsed = usedNumbers.filter((n) => n === value).length
  const countTotal = currentNumbers.filter((n) => n === value).length
  return countUsed < countTotal
}

/**
 * 安全地计算数学表达式（不使用 eval）
 */
export function safeEvaluate(expression: string): number | null {
  // 将显示用的运算符替换为标准符号
  const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/')

  // 只允许数字、运算符、括号、小数点、空格
  if (!/^[\d+\-*/().  ]+$/.test(normalized)) {
    return null
  }

  try {
    return parseExpression(normalized, 0).value
  } catch {
    return null
  }
}

// --- 递归下降解析器 ---
interface ParseResult {
  value: number
  pos: number
}

function parseExpression(expr: string, pos: number): ParseResult {
  return parseAddSub(expr, pos)
}

function parseAddSub(expr: string, pos: number): ParseResult {
  let result = parseMulDiv(expr, pos)
  while (result.pos < expr.length) {
    const ch = expr[result.pos]
    if (ch === '+' || ch === '-') {
      const right = parseMulDiv(expr, result.pos + 1)
      result = {
        value: ch === '+' ? result.value + right.value : result.value - right.value,
        pos: right.pos,
      }
    } else {
      break
    }
  }
  return result
}

function parseMulDiv(expr: string, pos: number): ParseResult {
  let result = parsePrimary(expr, pos)
  while (result.pos < expr.length) {
    const ch = expr[result.pos]
    if (ch === '*' || ch === '/') {
      const right = parsePrimary(expr, result.pos + 1)
      result = {
        value: ch === '*' ? result.value * right.value : result.value / right.value,
        pos: right.pos,
      }
    } else {
      break
    }
  }
  return result
}

function parsePrimary(expr: string, pos: number): ParseResult {
  // 跳过空格
  while (pos < expr.length && expr[pos] === ' ') pos++

  if (pos >= expr.length) {
    throw new Error('表达式不完整')
  }

  // 括号
  if (expr[pos] === '(') {
    const result = parseAddSub(expr, pos + 1)
    if (result.pos >= expr.length || expr[result.pos] !== ')') {
      throw new Error('括号不匹配')
    }
    return { value: result.value, pos: result.pos + 1 }
  }

  // 数字
  let numStr = ''
  while (pos < expr.length && (expr[pos] >= '0' && expr[pos] <= '9' || expr[pos] === '.')) {
    numStr += expr[pos]
    pos++
  }

  if (numStr === '') {
    throw new Error('期望数字')
  }

  return { value: parseFloat(numStr), pos }
}

/**
 * 从表达式中提取所有使用的数字
 */
export function extractNumbers(expression: string): number[] {
  const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/')
  const matches = normalized.match(/\d+/g)
  return matches ? matches.map(Number) : []
}

/**
 * 验证答案
 */
export function checkAnswer(
  expression: string,
  usedNumbers: number[],
  currentNumbers: number[],
): { isCorrect: boolean; error?: string; result?: number } {
  if (!expression.trim()) {
    return { isCorrect: false, error: '请输入表达式' }
  }

  // 检查是否使用了所有数字
  const sortedUsed = [...usedNumbers].sort((a, b) => a - b)
  const sortedTotal = [...currentNumbers].sort((a, b) => a - b)

  if (sortedUsed.length !== sortedTotal.length) {
    return { isCorrect: false, error: '请使用所有 4 个数字' }
  }

  for (let i = 0; i < sortedUsed.length; i++) {
    if (sortedUsed[i] !== sortedTotal[i]) {
      return { isCorrect: false, error: '使用的数字与给定的不匹配' }
    }
  }

  // 计算结果
  const result = safeEvaluate(expression)

  if (result === null || !isFinite(result)) {
    return { isCorrect: false, error: '表达式无法计算' }
  }

  if (Math.abs(result - 24) < 0.0001) {
    return { isCorrect: true, result: 24 }
  }

  return { isCorrect: false, error: `结果为 ${Number(result.toFixed(4))}，不等于 24`, result }
}
