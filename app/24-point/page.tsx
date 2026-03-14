'use client'

import Link from 'next/link'
import Card from '@/components/24-point/ui/Card'
import NicknameInput from '@/components/24-point/ui/NicknameInput'
import { useNickname } from '@/hooks/24-point/useNickname'

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

  if (!isReady) return null

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* 昵称输入弹窗 */}
      <NicknameInput
        open={!hasNickname}
        onSubmit={setNickname}
      />

      {/* 标题区域 */}
      <div className="text-center mb-10 sm:mb-14 animate-slide-up">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3 tracking-tight">
          24<span className="text-indigo-500">点</span>挑战
        </h1>
        <p className="text-gray-400 text-base sm:text-lg md:text-xl">
          用 4 个数字，算出 24
        </p>
        {hasNickname && (
          <p className="text-gray-400 text-sm mt-2">
            欢迎回来，<button onClick={() => { const name = prompt('修改昵称:', nickname); if (name?.trim()) setNickname(name.trim()) }} className="inline-flex items-center min-h-[44px] px-2 text-indigo-400 hover:text-indigo-500 active:text-indigo-600 underline decoration-dotted underline-offset-2 cursor-pointer">{nickname}</button>
          </p>
        )}
      </div>

      {/* 模式选择 */}
      <div className="w-full max-w-lg md:max-w-xl space-y-4">
        {modes.map((mode, index) => (
          <Link key={mode.href} href={mode.href} className="block">
            <Card
              glass
              padding="none"
              className={`
                group cursor-pointer
                hover:shadow-xl hover:-translate-y-0.5
                active:translate-y-0 active:shadow-lg
                transition-all duration-300 ease-out
                animate-slide-up
              `}
            >
              <div className="flex items-center gap-4 p-5 sm:p-6 md:p-7" style={{ animationDelay: `${index * 100}ms` }}>
                {/* 图标 */}
                <div className={`
                  w-14 h-14 rounded-2xl
                  bg-gradient-to-br ${mode.gradient}
                  shadow-lg ${mode.shadow}
                  flex items-center justify-center text-white
                  group-hover:scale-105 transition-transform duration-300
                `}>
                  {mode.icon}
                </div>
                {/* 文字 */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {mode.title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">{mode.description}</p>
                </div>
                {/* 箭头 */}
                <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* 底部说明 */}
      <p className="text-gray-300 text-xs mt-10">
        24点数学教学工具
      </p>
    </div>
  )
}
