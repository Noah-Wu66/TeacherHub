'use client'

import Link from 'next/link'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

const modes = [
  {
    href: '/sudoku/solo',
    title: '单人闯关',
    description: '循序渐进，挑战四宫至九宫数独',
    color: 'text-stone-800',
    borderColor: 'border-stone-800',
    bgColor: 'bg-[#e8dcc8]',
    icon: '一',
  },
  {
    href: '/sudoku/vs-ai',
    title: '人机对战',
    description: '挑战智能对手，比拼解题速度',
    color: 'text-amber-900',
    borderColor: 'border-amber-900',
    bgColor: 'bg-[#e8dcc8]',
    icon: '机',
  },
  {
    href: '/sudoku/multiplayer',
    title: '双人对战',
    description: '创建房间，与同窗共解同一局',
    color: 'text-rose-900',
    borderColor: 'border-rose-900',
    bgColor: 'bg-[#e8dcc8]',
    icon: '战',
  },
]

export default function SudokuHomePage() {
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用数独挑战。',
  })

  if (access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh bg-[#f4ece1]" />

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-[#f4ece1] font-serif relative z-10 w-full bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
      {/* 标题区域：古典印章与水墨风格 */}
      <div className="text-center mb-10 sm:mb-14 animate-slide-up flex flex-col items-center">
        <div className="mb-6 w-12 h-12 flex items-center justify-center border-2 border-red-800 rounded-sm bg-red-800/5 rotate-3">
          <span className="text-red-800 font-bold text-xl tracking-widest" style={{ writingMode: 'vertical-rl' }}>数独</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-bold text-stone-800 mb-4 tracking-[0.2em] relative">
          九宫<span className="text-red-800">幻方</span>
        </h1>
        
        {/* 滑动弹幕式提示语 (古风适配) */}
        <div className="mt-6 overflow-hidden max-w-sm sm:max-w-md w-full relative h-10 flex items-center justify-center border-y border-stone-400">
           <p className="text-stone-600 text-sm sm:text-base whitespace-nowrap px-4 font-bold tracking-widest text-center">
             纵横交错，九宫之内定乾坤
           </p>
        </div>
      </div>

      <div className="w-full max-w-lg md:max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {modes.map((mode, index) => (
          <Link key={mode.href} href={mode.href} className="block w-full outline-none">
            <div
              className={`
                group relative h-full p-6 sm:p-8
                ${mode.bgColor}
                border-2 ${mode.borderColor}
                hover:bg-[#d8cbb5]
                hover:-translate-y-1 hover:shadow-xl
                transition-all duration-300 ease-out
                animate-slide-up overflow-hidden
                flex flex-col items-center text-center
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* 四角装饰 */}
              <div className={`absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 ${mode.borderColor}`} />
              <div className={`absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 ${mode.borderColor}`} />
              <div className={`absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 ${mode.borderColor}`} />
              <div className={`absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 ${mode.borderColor}`} />
              
              <div className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-6
                border-2 ${mode.borderColor}
                flex items-center justify-center
                text-3xl sm:text-4xl font-bold ${mode.color}
                group-hover:scale-110
                transition-transform duration-500 ease-out
                bg-white/30
              `}>
                {mode.icon}
              </div>
              
              <h2 className={`text-2xl font-bold ${mode.color} mb-3 tracking-widest`}>
                {mode.title}
              </h2>
              <div className={`w-8 h-[2px] ${mode.bgColor} border-t ${mode.borderColor} mb-3`} />
              <p className="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
                {mode.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* 底部装饰 */}
      <div className="mt-16 sm:mt-24 text-center pb-8 flex items-center justify-center space-x-4">
        <div className="w-12 h-px bg-stone-400" />
        <p className="text-stone-500 text-sm font-bold tracking-[0.3em]">
          逻辑 · 推理 · 挑战
        </p>
        <div className="w-12 h-px bg-stone-400" />
      </div>
    </div>
  )
}
