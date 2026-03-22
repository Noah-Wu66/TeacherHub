'use client'

import Link from 'next/link'
import NicknameInput from '@/components/24-point/ui/NicknameInput'
import { useNickname } from '@/hooks/24-point/useNickname'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

const modes = [
  {
    href: '/24-point/solo',
    title: '单人练习',
    description: '独自挑战，提升你的24点计算能力',
    icon: (
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    suit: '♠',
    color: 'from-slate-700 to-slate-900',
    textColor: 'text-slate-300',
    accentColor: 'text-slate-100',
  },
  {
    href: '/24-point/vs-ai',
    title: '人机对战',
    description: '与 AI 对手比拼速度和准确率',
    icon: (
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
      </svg>
    ),
    suit: '♥',
    color: 'from-red-700 to-red-900',
    textColor: 'text-red-200',
    accentColor: 'text-red-100',
  },
  {
    href: '/24-point/multiplayer',
    title: '多人联机',
    description: '邀请好友实时对战，一决高下',
    icon: (
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    suit: '♣',
    color: 'from-amber-600 to-amber-900',
    textColor: 'text-amber-200',
    accentColor: 'text-amber-100',
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

      {/* 标题区域：暗黑赌场奢华风 */}
      <div className="text-center mb-10 sm:mb-14 animate-slide-up flex flex-col items-center">
        <div className="inline-block relative">
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-2 tracking-widest drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] font-serif italic">
            24 <span className="text-amber-400">POKER</span>
          </h1>
          <div className="absolute -inset-4 blur-3xl opacity-30 bg-amber-500 rounded-full mix-blend-screen pointer-events-none -z-10" />
        </div>
        <p className="text-amber-200/80 text-lg sm:text-xl font-medium tracking-[0.2em] mt-3 font-mono uppercase">
          Calculate to Win
        </p>
        {hasNickname && (
          <div className="mt-6 px-6 py-2 rounded-full bg-black/40 border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.1)] backdrop-blur-md">
            <p className="text-amber-100/80 text-sm font-medium tracking-wider">
              欢迎入局，<span className="text-amber-400 font-bold ml-1">{nickname}</span>
            </p>
          </div>
        )}
      </div>

      {/* 沉浸式模式选择：精装扑克牌/入场券 */}
      <div className="w-full max-w-lg md:max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-4">
        {modes.map((mode, index) => (
          <Link key={mode.href} href={mode.href} className="block w-full outline-none perspective-1000">
            <div
              className={`
                group relative h-full rounded-[2rem] p-1 
                bg-gradient-to-b ${mode.color}
                shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]
                hover:-translate-y-4 hover:rotate-y-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(251,191,36,0.2)]
                active:translate-y-0 active:scale-95
                transition-all duration-500 ease-out
                animate-slide-up
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* 卡牌内框 */}
              <div className="absolute inset-1.5 sm:inset-2 border-2 border-white/20 rounded-[1.7rem] pointer-events-none" />
              <div className="absolute inset-2 sm:inset-2.5 border border-white/10 rounded-[1.6rem] pointer-events-none" />
              
              <div className="relative h-full bg-black/20 backdrop-blur-sm rounded-[1.8rem] p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden">
                {/* 装饰性大花色底纹 */}
                <div className="absolute -right-8 -bottom-8 text-9xl opacity-[0.05] pointer-events-none rotate-12 select-none">
                  {mode.suit}
                </div>
                
                {/* 悬浮图标 */}
                <div className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-6
                  bg-black/40 border border-white/10
                  shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.4)]
                  flex items-center justify-center ${mode.accentColor}
                  group-hover:scale-110 group-hover:-rotate-12
                  transition-transform duration-500 ease-out
                `}>
                  {mode.icon}
                </div>
                
                {/* 标题与描述 */}
                <h2 className={`text-2xl sm:text-3xl font-black ${mode.accentColor} mb-3 tracking-wider uppercase font-serif`}>
                  {mode.title}
                </h2>
                <div className="w-12 h-0.5 bg-white/20 mb-4 rounded-full" />
                <p className={`text-sm sm:text-base ${mode.textColor} font-medium leading-relaxed`}>
                  {mode.description}
                </p>
                
                {/* 底部花色点缀 */}
                <div className={`absolute top-4 left-5 text-xl opacity-60 ${mode.accentColor}`}>
                  {mode.suit}
                </div>
                <div className={`absolute bottom-4 right-5 text-xl opacity-60 ${mode.accentColor} rotate-180`}>
                  {mode.suit}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 底部装饰 */}
      <div className="mt-16 sm:mt-24 text-center">
        <p className="text-emerald-900/40 text-xs font-bold uppercase tracking-[0.4em] font-mono">
          High Stakes · Pure Math
        </p>
      </div>
    </div>
  )
}
