import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '24点挑战 - 扑克对决',
  description: '经典24点扑克牌桌游 — 支持单人练习、人机对战、多人联机PK',
}

export const viewport: Viewport = {
  themeColor: '#0a3326',
}

export default function TwentyFourPointLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-[#0a3326] text-white overflow-hidden relative selection:bg-emerald-500/30">
      {/* 沉浸式扑克牌桌绿呢绒背景 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, #196b51 0%, #0a3326 100%)',
        }}
      />
      
      {/* 牌桌纹理 (早期的 SVG noise) */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* 桌边装饰线 */}
      <div className="absolute inset-4 md:inset-8 border-2 border-[#1e8262] rounded-[3rem] opacity-30 pointer-events-none" />
      <div className="absolute inset-[1.25rem] md:inset-[2.25rem] border border-[#1e8262] rounded-[2.75rem] opacity-20 pointer-events-none" />

      <div className="relative z-10 h-full text-slate-100">
        {children}
      </div>
    </div>
  )
}
