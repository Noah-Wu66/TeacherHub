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
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="text-center mb-10 sm:mb-14 animate-slide-up">
        <p className="text-sm tracking-[0.3em] text-sky-500 uppercase">Sudoku Challenge</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          数独<span className="text-sky-500">挑战</span>
        </h1>
        <p className="mt-3 text-slate-500 text-base sm:text-lg">
          一边闯关，一边学会发现数独中的关键信息
        </p>
      </div>

      <div className="w-full max-w-xl space-y-4">
        {modes.map((mode, index) => (
          <Link key={mode.href} href={mode.href} className="block">
            <Card
              glass
              padding="none"
              className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-slide-up"
            >
              <div className="flex items-center gap-4 p-5 sm:p-6" style={{ animationDelay: `${index * 80}ms` }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.gradient} text-white shadow-lg flex items-center justify-center text-lg font-black`}>
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                    {mode.title}
                  </h2>
                  <p className="mt-1 text-sm sm:text-base text-slate-500 leading-6">
                    {mode.description}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
