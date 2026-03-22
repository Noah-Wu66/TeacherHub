'use client'

import Link from 'next/link'
import Card from '@/components/24-point/ui/Card'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

const modes = [
  {
    href: '/sudoku/solo',
    title: '单人闯关',
    description: '按关卡逐步挑战 4x4、6x6、9x9 数独',
    gradient: 'from-sky-500 to-cyan-500',
    icon: '1',
  },
  {
    href: '/sudoku/coach',
    title: '教学陪练',
    description: '分层提示你先看哪里、能填什么、最后该填几',
    gradient: 'from-amber-500 to-orange-500',
    icon: '教',
  },
  {
    href: '/sudoku/multiplayer',
    title: '双人竞速',
    description: '创建在线房间，和同学做同一题比谁先完成',
    gradient: 'from-violet-500 to-fuchsia-500',
    icon: 'VS',
  },
]

export default function SudokuHomePage() {
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用数独挑战。',
  })

  if (access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh" />

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative z-10 w-full">
      {/* 标题区域：浅色拟物玻璃发光 */}
      <div className="text-center mb-10 sm:mb-14 animate-slide-up flex flex-col items-center">
        <p className="text-sm font-black tracking-[0.5em] text-sky-500/80 uppercase mb-4 drop-shadow-sm">Sudoku Challenge</p>
        <div className="inline-block relative">
          <h1 className="text-5xl sm:text-7xl font-black text-slate-800 mb-2 tracking-tight drop-shadow-sm">
            数独<span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-500 to-cyan-500">挑战</span>
          </h1>
          <div className="absolute -inset-1 blur-2xl opacity-40 bg-sky-200 rounded-full mix-blend-multiply pointer-events-none -z-10" />
        </div>
        
        {/* 滑动弹幕式提示语 (浅色适配) */}
        <div className="mt-6 overflow-hidden max-w-sm sm:max-w-md w-full relative h-10 flex items-center justify-center rounded-full bg-white/60 border border-white/80 shadow-[0_2px_8px_rgba(14,165,233,0.1)] backdrop-blur-md">
           <p className="text-slate-600 text-sm sm:text-base whitespace-nowrap px-4 font-mono font-bold drop-shadow-sm text-center">
             一边闯关，一边学会发现数独中的关键信息
           </p>
        </div>
      </div>

      <div className="w-full max-w-lg md:max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {modes.map((mode, index) => (
          <Link key={mode.href} href={mode.href} className="block w-full outline-none">
            <div
              className={`
                group relative h-full rounded-3xl p-6 sm:p-8
                bg-white/70 backdrop-blur-xl
                border-2 border-white shadow-[0_8px_32px_rgba(14,165,233,0.15)]
                hover:bg-white/95 hover:border-sky-100
                hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(14,165,233,0.25)]
                active:translate-y-0 active:scale-95
                transition-all duration-300 ease-out
                animate-slide-up overflow-hidden
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* 卡片内置流光彩晕：采用纯 CSS 渐变光晕消除 blur 边缘裁切问题 */}
              <div 
                className="absolute inset-0 opacity-[0.85] group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-multiply"
                style={{
                  background: index === 0 
                    ? 'radial-gradient(circle at 100% 0%, rgba(6,182,212,0.1) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(14,165,233,0.08) 0%, transparent 60%)' 
                    : index === 1 
                    ? 'radial-gradient(circle at 100% 0%, rgba(249,115,22,0.1) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(245,158,11,0.08) 0%, transparent 60%)'
                    : 'radial-gradient(circle at 100% 0%, rgba(217,70,239,0.1) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(139,92,246,0.08) 0%, transparent 60%)'
                }}
              />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mb-6
                  bg-gradient-to-br ${mode.gradient}
                  shadow-[0_8px_20px_rgba(14,165,233,0.3)]
                  flex items-center justify-center text-white
                  text-3xl sm:text-4xl font-black
                  group-hover:scale-110 group-hover:-rotate-3
                  transition-transform duration-500 ease-out
                `}>
                  {mode.icon}
                </div>
                
                <h2 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">
                  {mode.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium group-hover:text-slate-600 mt-1 transition-colors">
                  {mode.description}
                </p>
                
                <div className="mt-8 mb-2 flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 group-hover:bg-sky-50 group-hover:text-sky-600 text-slate-400 transition-all duration-300 border border-slate-100 group-hover:border-sky-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* 底部装饰 */}
      <div className="mt-16 sm:mt-24 text-center pb-8">
        <p className="text-sky-900/30 text-xs font-bold uppercase tracking-[0.3em] font-mono">
          Logic · Grid · Challenge
        </p>
      </div>
    </div>
  )
}
