import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '24点挑战',
  description: '现代简约的24点数学教学游戏 — 支持单人练习、人机对战、多人联机PK',
}

export const viewport: Viewport = {
  themeColor: '#f0f4ff',
}

export default function TwentyFourPointLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-[#f8fafc] text-slate-800 overflow-hidden relative selection:bg-indigo-500/30">
      {/* 沉浸式场景光效 (适配浅色) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.15),transparent_40%)] pointer-events-none" />
      
      {/* 24点专属背景底纹：数学符号与扑克花色混合，带有细微纸质噪点 */}
      <div 
        className="absolute inset-0 opacity-[0.6] pointer-events-none mix-blend-multiply" 
        style={{
          backgroundImage: `
            url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E"),
            url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M160 0L0 0L0 160' fill='none' stroke='%23e2e8f0' stroke-width='1' stroke-opacity='0.5'/%3E%3Cpath d='M80 0L80 160M0 80L160 80' fill='none' stroke='%23f1f5f9' stroke-width='1' stroke-opacity='0.5'/%3E%3Ctext x='20' y='35' fill='%236366f1' fill-opacity='0.08' font-family='sans-serif' font-size='24' font-weight='bold'%3E+%3C/text%3E%3Ctext x='110' y='45' fill='%23ef4444' fill-opacity='0.06' font-family='sans-serif' font-size='24'%3E%E2%99%A5%3C/text%3E%3Ctext x='40' y='115' fill='%233b82f6' fill-opacity='0.06' font-family='sans-serif' font-size='24'%3E%E2%99%A0%3C/text%3E%3Ctext x='120' y='125' fill='%238b5cf6' fill-opacity='0.08' font-family='sans-serif' font-size='24' font-weight='bold'%3E%C3%97%3C/text%3E%3Ctext x='75' y='75' fill='%2310b981' fill-opacity='0.08' font-family='sans-serif' font-size='24' font-weight='bold'%3E%C3%B7%3C/text%3E%3Ctext x='80' y='145' fill='%23f43f5e' fill-opacity='0.06' font-family='sans-serif' font-size='24'%3E%E2%99%A6%3C/text%3E%3Ctext x='140' y='85' fill='%236366f1' fill-opacity='0.08' font-family='sans-serif' font-size='28' font-weight='bold'%3E-%3C/text%3E%3Ctext x='15' y='150' fill='%233b82f6' fill-opacity='0.06' font-family='sans-serif' font-size='24'%3E%E2%99%A3%3C/text%3E%3C/svg%3E")
          `,
          backgroundSize: '200px 200px, 160px 160px'
        }}
      />
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
