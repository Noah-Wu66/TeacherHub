'use client'

import Link from 'next/link'
import { useAuth } from '@/components/platform/auth/AuthProvider'
import { useAccessControl } from '@/components/platform/auth/useAccessControl'

function IconAI() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M24 6C14.06 6 6 14.06 6 24s8.06 18 18 18 18-8.06 18-18S33.94 6 24 6z" fill="url(#ai-grad)" opacity="0.15"/>
      <path d="M24 12a6 6 0 0 0-6 6v1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2v1c0 2.21 1.2 4.14 3 5.18V34a2 2 0 1 0 4 0v-1.5a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1V34a2 2 0 1 0 4 0v-2.82A6.98 6.98 0 0 0 34 26v-1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2v-1a6 6 0 0 0-6-6h-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="21" cy="21" r="1.5" fill="currentColor"/>
      <circle cx="27" cy="21" r="1.5" fill="currentColor"/>
      <path d="M21 26c0 0 1.5 1.5 3 1.5s3-1.5 3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 18h-2M14 22h-3M36 18h-2M36 22h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <defs>
        <linearGradient id="ai-grad" x1="6" y1="6" x2="42" y2="42">
          <stop stopColor="#8B5CF6"/>
          <stop offset="1" stopColor="#6D28D9"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function Icon24Point() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect x="8" y="8" width="32" height="32" rx="6" fill="url(#p24-grad)" opacity="0.15"/>
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <text x="24" y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" fontFamily="system-ui">24</text>
      <circle cx="16" cy="32" r="1.5" fill="currentColor" opacity="0.6"/>
      <circle cx="24" cy="32" r="1.5" fill="currentColor" opacity="0.6"/>
      <circle cx="32" cy="32" r="1.5" fill="currentColor" opacity="0.6"/>
      <circle cx="20" cy="28" r="1.5" fill="currentColor" opacity="0.6"/>
      <path d="M30 26l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <defs>
        <linearGradient id="p24-grad" x1="8" y1="8" x2="40" y2="40">
          <stop stopColor="#3B82F6"/>
          <stop offset="1" stopColor="#4F46E5"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IconSudoku() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect x="8" y="8" width="32" height="32" rx="6" fill="url(#sudoku-grad)" opacity="0.15"/>
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M19.33 10v28M28.67 10v28M10 19.33h28M10 28.67h28" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>
      <text x="15" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fontFamily="system-ui">5</text>
      <text x="24" y="26" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fontFamily="system-ui">3</text>
      <text x="33" y="35" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fontFamily="system-ui">9</text>
      <defs>
        <linearGradient id="sudoku-grad" x1="8" y1="8" x2="40" y2="40">
          <stop stopColor="#0EA5E9"/>
          <stop offset="1" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IconMath() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect x="8" y="6" width="32" height="36" rx="4" fill="url(#math-grad)" opacity="0.15"/>
      <rect x="10" y="8" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="10" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
      <text x="24" y="14" textAnchor="middle" fontSize="7" fontWeight="600" fill="currentColor" fontFamily="system-ui">MATH</text>
      <path d="M16 22h6M19 19v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 22h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 31l5 5M21 31l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 32h6M28 35h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="math-grad" x1="8" y1="6" x2="40" y2="42">
          <stop stopColor="#10B981"/>
          <stop offset="1" stopColor="#0D9488"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IconSundial() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <circle cx="24" cy="20" r="14" fill="url(#sun-grad)" opacity="0.15"/>
      <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="24" cy="20" r="2" fill="currentColor"/>
      <path d="M24 8v4M24 28v4M12 20h4M32 20h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15.5 11.5l2.8 2.8M29.7 25.7l2.8 2.8M15.5 28.5l2.8-2.8M29.7 14.3l2.8-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M14 38h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 20l0 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 20l-6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <defs>
        <linearGradient id="sun-grad" x1="10" y1="6" x2="38" y2="34">
          <stop stopColor="#F59E0B"/>
          <stop offset="1" stopColor="#EA580C"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IconTree() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M24 6L12 22h6l-5 10h6l-4 8h18l-4-8h6l-5-10h6L24 6z" fill="url(#tree-grad)" opacity="0.15"/>
      <path d="M24 8l-9 12h5l-4 8h5l-3 6h12l-3-6h5l-4-8h5L24 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
      <rect x="22" y="34" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M18 42h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="18" r="1" fill="currentColor" opacity="0.4"/>
      <circle cx="26" cy="24" r="1" fill="currentColor" opacity="0.4"/>
      <circle cx="21" cy="28" r="1" fill="currentColor" opacity="0.4"/>
      <defs>
        <linearGradient id="tree-grad" x1="12" y1="6" x2="36" y2="42">
          <stop stopColor="#22C55E"/>
          <stop offset="1" stopColor="#65A30D"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IconCube() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M24 6l16 9v18l-16 9-16-9V15l16-9z" fill="url(#cube-grad)" opacity="0.15"/>
      <path d="M24 8l14 8v16l-14 8-14-8V16l14-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
      <path d="M24 24v16" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 24l14-8" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 24L10 16" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 16l14 8 14-8" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="2 2"/>
      <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.5"/>
      <defs>
        <linearGradient id="cube-grad" x1="8" y1="6" x2="40" y2="42">
          <stop stopColor="#F43F5E"/>
          <stop offset="1" stopColor="#DB2777"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

const projects = [
  {
    href: '/ai-education',
    title: '智趣学',
    description: 'AI 学习平台，支持文字聊天、语音通话、大思政课专题',
    color: 'violet',
    tag: 'AI',
    Icon: IconAI,
  },
  {
    href: '/24-point',
    title: '24点挑战',
    description: '24点数学游戏，支持单人练习、人机对战、多人联机',
    color: 'blue',
    tag: '游戏',
    Icon: Icon24Point,
  },
  {
    href: '/sudoku',
    title: '数独挑战',
    description: '数独闯关工具，支持单人闯关、教学陪练、双人竞速',
    color: 'cyan',
    tag: '闯关',
    Icon: IconSudoku,
  },
  {
    href: '/math',
    title: '数你最棒',
    description: '1-6 年级小学数学练习，覆盖各章节知识点',
    color: 'emerald',
    tag: '练习',
    Icon: IconMath,
  },
  {
    href: '/tugui',
    title: '土圭之法',
    description: '古代天文观测模拟器，展示节气太阳高度角和日影变化',
    color: 'amber',
    tag: '模拟',
    Icon: IconSundial,
  },
  {
    href: '/planting',
    title: '植树问题',
    description: '五年级植树问题 AI 学习平台，可视化演示 + AI 辅导',
    color: 'green',
    tag: '可视化',
    Icon: IconTree,
  },
  {
    href: '/teacher-tools',
    title: '三视图教学工具',
    description: '交互式三视图教学工具，根据视图摆放小正方体',
    color: 'rose',
    tag: '交互',
    Icon: IconCube,
  },
]

const colorMap: Record<string, { card: string; icon: string; title: string; tag: string }> = {
  violet: {
    card: 'hover:border-violet-200 hover:shadow-violet-100/50',
    icon: 'bg-violet-50 text-violet-600',
    title: 'group-hover:text-violet-700',
    tag: 'bg-violet-50 text-violet-600',
  },
  blue: {
    card: 'hover:border-blue-200 hover:shadow-blue-100/50',
    icon: 'bg-blue-50 text-blue-600',
    title: 'group-hover:text-blue-700',
    tag: 'bg-blue-50 text-blue-600',
  },
  emerald: {
    card: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
    icon: 'bg-emerald-50 text-emerald-600',
    title: 'group-hover:text-emerald-700',
    tag: 'bg-emerald-50 text-emerald-600',
  },
  cyan: {
    card: 'hover:border-cyan-200 hover:shadow-cyan-100/50',
    icon: 'bg-cyan-50 text-cyan-600',
    title: 'group-hover:text-cyan-700',
    tag: 'bg-cyan-50 text-cyan-600',
  },
  amber: {
    card: 'hover:border-amber-200 hover:shadow-amber-100/50',
    icon: 'bg-amber-50 text-amber-600',
    title: 'group-hover:text-amber-700',
    tag: 'bg-amber-50 text-amber-600',
  },
  green: {
    card: 'hover:border-green-200 hover:shadow-green-100/50',
    icon: 'bg-green-50 text-green-600',
    title: 'group-hover:text-green-700',
    tag: 'bg-green-50 text-green-600',
  },
  rose: {
    card: 'hover:border-rose-200 hover:shadow-rose-100/50',
    icon: 'bg-rose-50 text-rose-600',
    title: 'group-hover:text-rose-700',
    tag: 'bg-rose-50 text-rose-600',
  },
}

export default function HomePage() {
  const { openAccountDialog } = useAuth()
  const { loading, allowed, user } = useAccessControl({
    allowGuest: false,
    reason: '首页仅正式用户可访问，请先登录正式账号。',
  })

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#fafbfc]">
        <div className="text-center text-gray-500">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
          <p className="mt-4 text-sm">正在读取账户信息...</p>
        </div>
      </div>
    )
  }

  if (!allowed || !user) {
    return <div className="min-h-dvh bg-[#fafbfc]" />
  }

  return (
    <div className="min-h-dvh bg-[#fafbfc] relative overflow-hidden">
      {/* 装饰背景 */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-violet-100/40 to-blue-100/30 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-100/30 to-teal-100/20 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-amber-100/30 to-orange-100/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
        {/* Hero */}
        <header className="mb-14 sm:mb-20 animate-[fadeIn_0.6s_ease-out_both]">
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Current Account</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {user.displayName} · {user.role === 'superadmin' ? '超级管理员' : user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : '学生'}
              </p>
            </div>
            <button
              type="button"
              onClick={openAccountDialog}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              账户中心
            </button>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                <path d="M12 3L2 9l10 6 10-6-10-6z" fill="currentColor" opacity="0.9"/>
                <path d="M2 17l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 13l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-400 tracking-wide">TEACHING TOOLS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            李雪教学工具集
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-400 max-w-xl leading-relaxed">
            为课堂教学打造的互动工具，让数学与科学变得生动有趣
          </p>
        </header>

        {/* 工具网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {projects.map((project, index) => {
            const colors = colorMap[project.color]
            return (
              <Link
                key={project.href}
                href={project.href}
                className="group block animate-[slideUp_0.5s_ease-out_both]"
                style={{ animationDelay: `${index * 80 + 200}ms` }}
              >
                <div className={`relative h-full p-5 sm:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 ${colors.card}`}>
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <project.Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-lg font-semibold text-gray-800 transition-colors duration-200 ${colors.title}`}>
                        {project.title}
                      </h2>
                      <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.tag}`}>
                      {project.tag}
                    </span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* 底部 */}
        <footer className="mt-16 sm:mt-20 pt-8 border-t border-gray-100 animate-[fadeIn_0.6s_ease-out_0.8s_both]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300">
            <span>北京市朝阳区白家庄小学 李雪</span>
            <span>{projects.length} 个教学工具</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
