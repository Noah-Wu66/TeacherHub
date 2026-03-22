'use client'

interface ExpressionInputProps {
  expression: string
  isActive: boolean
  feedback?: 'success' | 'error' | null
  compact?: boolean
}

export default function ExpressionInput({
  expression,
  isActive,
  feedback,
  compact = false,
}: ExpressionInputProps) {
  // 解析表达式为 token 数组（数字和操作符）
  const tokens = expression.match(/\d+|[+\-*/()]/g) || []

  return (
    <div
      className={`
        ${compact ? 'min-h-[56px] px-3 py-2 rounded-xl' : 'min-h-[72px] sm:min-h-[80px] px-4 sm:px-5 py-3 rounded-2xl'}
        w-full flex items-center justify-center
        overflow-x-auto overflow-y-hidden whitespace-nowrap
        transition-all duration-300 select-none
        ${
          feedback === 'success'
            ? 'bg-emerald-900/40 border-2 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pop'
            : feedback === 'error'
              ? 'bg-rose-900/40 border-2 border-rose-500/50 animate-shake shadow-[inset_0_0_15px_rgba(244,63,94,0.3)]'
              : 'bg-black/20 border-2 border-white/10 shadow-inner'
        }
      `}
      style={{
        boxShadow: feedback === 'success' ? '0 0 20px rgba(16,185,129,0.4), inset 0 0 10px rgba(16,185,129,0.2)' : 
                   feedback === 'error' ? '0 0 20px rgba(244,63,94,0.4), inset 0 0 10px rgba(244,63,94,0.2)' : 
                   'inset 0 4px 10px rgba(0,0,0,0.5)'
      }}
    >
      {tokens.length > 0 ? (
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {tokens.map((token, index) => {
            if (/\d+/.test(token)) {
              // 渲染卡牌
              const num = parseInt(token)
              let display = token
              if (num === 1) display = 'A'
              if (num === 11) display = 'J'
              if (num === 12) display = 'Q'
              if (num === 13) display = 'K'
              
              return (
                <div 
                  key={index} 
                  className={`
                    inline-flex items-center justify-center bg-white text-slate-900 font-bold rounded shadow-md border border-slate-200
                    ${compact ? 'w-8 h-10 text-sm' : 'w-10 h-12 sm:w-12 sm:h-14 text-base sm:text-lg'}
                  `}
                >
                  {display}
                </div>
              )
            } else {
              // 渲染筹码
              let color = 'bg-slate-700 border-slate-500'
              let label = token
              if (token === '+') { color = 'bg-red-600 border-red-400'; label = '+' }
              if (token === '-') { color = 'bg-blue-600 border-blue-400'; label = '−' }
              if (token === '*') { color = 'bg-emerald-600 border-emerald-400'; label = '×' }
              if (token === '/') { color = 'bg-slate-800 border-slate-600'; label = '÷' }
              if (token === '(' || token === ')') color = 'bg-purple-600 border-purple-400'

              return (
                <div 
                  key={index} 
                  className={`
                    inline-flex items-center justify-center rounded-full text-white font-black shadow-md border-2 border-double
                    ${compact ? 'w-7 h-7 text-xs mx-0.5' : 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base mx-1'}
                    ${color}
                  `}
                >
                  {label}
                </div>
              )
            }
          })}
        </div>
      ) : (
        <span className="text-white/30 text-sm sm:text-base font-medium tracking-widest uppercase">
          {isActive ? 'PLACE YOUR CARDS' : 'WAITING FOR ROUND'}
        </span>
      )}
    </div>
  )
}
