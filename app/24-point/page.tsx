'use client'

import Link from 'next/link'
import Card from '@/components/24-point/ui/Card'
import NicknameInput from '@/components/24-point/ui/NicknameInput'
import { useNickname } from '@/hooks/24-point/useNickname'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

const modes = [
  {
    href: '/24-point/solo',
    title: '单人练习',
    description: '独自挑战，提升你的24点计算能力',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-500',
    shadow: 'shadow-blue-200/60',
  },
  {
    href: '/24-point/vs-ai',
    title: '人机对战',
    description: '与 AI 对手比拼速度和准确率',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-500',
    shadow: 'shadow-purple-200/60',
  },
  {
    href: '/24-point/multiplayer',
    title: '多人联机',
    description: '邀请好友实时对战，一决高下',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-200/60',
  },
]

export default function Home() {
  const { nickname, setNickname, hasNickname, isReady } = useNickname()
  const access = useAccessControl({
    allowGuest: true,
    reason: '请先登录正式账号或游客账号后再使用 24 点挑战。',
  })

  if (!isReady || access.loading) return null
  if (!access.allowed) return <div className="min-h-dvh" />

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <NicknameInput
        open={!hasNickname}
        onSubmit={setNickname}
      />

      {/* 标题区域：科幻发光字体与立体阴影 */}
      <div className="text-center mb-10 sm:mb-14 animate-slide-up flex flex-col items-center">
        <div className="inline-block relative">
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-2 tracking-tight drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            24<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">点</span>挑战
          </h1>
          <div className="absolute -inset-1 blur-2xl opacity-30 bg-indigo-500 rounded-full mix-blend-screen pointer-events-none -z-10" />
        </div>
        <p className="text-indigo-200/80 text-lg sm:text-xl font-medium tracking-wide drop-shadow-sm mt-2 font-mono">
          用 4 个数字，算出 24
        </p>
        {hasNickname && (
          <div className="mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-slate-300 text-sm font-medium">
              欢迎回来，<span className="text-indigo-300 font-bold ml-1">{nickname}</span>
            </p>
          </div>
        )}
      </div>

      {/* 沉浸式模式选择：3D玻璃机能风 */}
      <div className="w-full max-w-lg md:max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-4">
        {modes.map((mode, index) => (
          <Link key={mode.href} href={mode.href} className="block w-full outline-none">
            <div
              className={`
                group relative h-full rounded-3xl p-6 sm:p-8
                bg-white/5 backdrop-blur-xl
                border border-white/10 shadow-[0_8px_32px_rgb(0,0,0,0.3)]
                hover:bg-white/10 hover:border-white/20
                hover:-translate-y-2 hover:shadow-[0_15px_40px_rgb(0,0,0,0.5)]
                active:translate-y-0 active:scale-95
                transition-all duration-300 ease-out
                animate-slide-up overflow-hidden
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* 卡片内置流光溢彩：改为圆形以消除锐利直边 */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${mode.gradient} opacity-20 blur-[50px] group-hover:opacity-40 transition-opacity duration-300`} />
              <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-tr ${mode.gradient} opacity-10 blur-[40px] group-hover:opacity-30 transition-opacity duration-300`} />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* 悬浮图标 */}
                <div className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mb-6
                  bg-gradient-to-br ${mode.gradient}
                  shadow-[0_0_20px_rgba(0,0,0,0.5)]
                  flex items-center justify-center text-white
                  group-hover:scale-110 group-hover:rotate-3
                  transition-transform duration-500 ease-out
                `}>
                  {mode.icon}
                </div>
                
                {/* 标题与描述 */}
                <h2 className="text-2xl font-black text-slate-100 mb-2 drop-shadow-sm">
                  {mode.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                  {mode.description}
                </p>
                
                {/* 箭头装饰 */}
                <div className="mt-6 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 text-slate-500 transition-all duration-300">
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
      <div className="mt-16 sm:mt-24 text-center">
        <p className="text-slate-500/50 text-xs font-bold uppercase tracking-[0.3em] font-mono">
          Mathematics · Speed · Logic
        </p>
      </div>
    </div>
  )
}
