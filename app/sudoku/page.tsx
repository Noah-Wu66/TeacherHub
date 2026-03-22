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
      {/* 标题区域：科幻发光字体 */}
      <div className="text-center mb-10 sm:mb-14 animate-slide-up flex flex-col items-center">
        <p className="text-sm font-black tracking-[0.5em] text-sky-400/80 uppercase mb-4 drop-shadow-sm">Sudoku Challenge</p>
        <div className="inline-block relative">
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-2 tracking-tight drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
            数独<span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-400 to-cyan-400">挑战</span>
          </h1>
          <div className="absolute -inset-1 blur-2xl opacity-20 bg-sky-500 rounded-full mix-blend-screen pointer-events-none -z-10" />
        </div>
        
        {/* 滑动弹幕式提示语 */}
        <div className="mt-6 overflow-hidden max-w-sm sm:max-w-md w-full relative h-10 flex items-center justify-center rounded-full bg-slate-800/50 border border-slate-700/50">
           <p className="text-slate-300 text-sm sm:text-base whitespace-nowrap px-4 font-mono font-medium drop-shadow-sm text-center">
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
                bg-slate-800/40 backdrop-blur-md
                border border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                hover:bg-slate-800/60 hover:border-sky-500/30
                hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(14,165,233,0.2)]
                active:translate-y-0 active:scale-95
                transition-all duration-300 ease-out
                animate-slide-up overflow-hidden
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* 卡片内置流光彩晕：改为圆形以消除锐利直边 */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${mode.gradient} opacity-10 blur-[40px] group-hover:opacity-30 transition-opacity duration-300`} />
              <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-tr ${mode.gradient} opacity-5 blur-[30px] group-hover:opacity-20 transition-opacity duration-300`} />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mb-6
                  bg-gradient-to-br ${mode.gradient}
                  shadow-[0_0_20px_rgba(0,0,0,0.6)]
                  flex items-center justify-center text-white
                  text-3xl sm:text-4xl font-black
                  group-hover:scale-110 group-hover:-rotate-3
                  transition-transform duration-500 ease-out
                `}>
                  {mode.icon}
                </div>
                
                <h2 className="text-2xl font-bold text-slate-100 mb-2 drop-shadow-sm group-hover:text-sky-400 transition-colors">
                  {mode.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-400 font-medium group-hover:text-slate-300 mt-1">
                  {mode.description}
                </p>
                
                <div className="mt-8 mb-2 flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/80 group-hover:bg-sky-500/20 group-hover:text-sky-400 text-slate-500 transition-all duration-300 border border-slate-700/50 group-hover:border-sky-500/30">
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
        <p className="text-slate-600/60 text-xs font-bold uppercase tracking-[0.3em] font-mono">
          Logic · Grid · Challenge
        </p>
      </div>
    </div>
  )
}
