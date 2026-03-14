import Link from 'next/link'

const projects = [
  {
    href: '/ai-education',
    title: '智趣学',
    description: 'AI 学习平台，支持文字聊天、语音通话、大思政课专题',
    gradient: 'from-violet-500 to-purple-600',
    icon: '🤖',
  },
  {
    href: '/24-point',
    title: '24点挑战',
    description: '24点数学游戏，支持单人练习、人机对战、多人联机',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🎯',
  },
  {
    href: '/math',
    title: '数你最棒',
    description: '1-6 年级小学数学练习，覆盖各章节知识点',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '🎓',
  },
  {
    href: '/tugui',
    title: '土圭之法',
    description: '古代天文观测模拟器，展示节气太阳高度角和日影变化',
    gradient: 'from-amber-500 to-orange-600',
    icon: '🌞',
  },
  {
    href: '/planting',
    title: '植树问题',
    description: '五年级植树问题 AI 学习平台，可视化演示 + AI 辅导',
    gradient: 'from-green-500 to-lime-600',
    icon: '🌳',
  },
  {
    href: '/teacher-tools',
    title: '三视图教学工具',
    description: '交互式三视图教学工具，根据视图摆放小正方体',
    gradient: 'from-rose-500 to-pink-600',
    icon: '🧊',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col items-center px-4 py-12 sm:py-16">
      <div className="text-center mb-12 animate-[slideUp_0.5s_ease-out_both]">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3 tracking-tight">
          李雪教学工具集
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">
          选择一个工具开始使用
        </p>
      </div>

      <div className="w-full max-w-2xl grid gap-4">
        {projects.map((project, index) => (
          <Link
            key={project.href}
            href={project.href}
            className="group block"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center gap-4 p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-out animate-[slideUp_0.5s_ease-out_both]" style={{ animationDelay: `${(index + 1) * 80}ms` }}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${project.gradient} shadow-lg flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300`}>
                {project.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-gray-300 text-xs mt-12">
        北京市朝阳区白家庄小学 李雪
      </p>
    </div>
  )
}
