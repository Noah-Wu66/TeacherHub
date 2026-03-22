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
    <div className="min-h-dvh bg-indigo-50/40 text-slate-800 overflow-hidden relative selection:bg-indigo-500/30">
      {/* 沉浸式场景光效 (适配浅色，增强色彩使其更具游戏感) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.22),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.2),transparent_50%)] pointer-events-none" />
      
      {/* 24点专属游戏背景底纹：大幅明显的扑克花色、卡牌轮廓、算术符号与网格 */}
      <div 
        className="absolute inset-0 opacity-[0.8] pointer-events-none mix-blend-multiply" 
        style={{
          backgroundImage: `
            url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E"),
            url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cpath d='M400 0L0 0L0 400' fill='none' stroke='%236366f1' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Cpath d='M100 0L100 400M200 0L200 400M300 0L300 400M0 100L400 100M0 200L400 200M0 300L400 300' fill='none' stroke='%236366f1' stroke-width='1' stroke-opacity='0.08'/%3E%3Cg opacity='0.25'%3E%3Cg transform='rotate(-12 75 110)'%3E%3Crect x='40' y='60' width='70' height='100' rx='8' fill='none' stroke='%23334155' stroke-width='3'/%3E%3Ctext x='55' y='125' fill='%23ef4444' font-family='sans-serif' font-size='48'%3E%E2%99%A5%3C/text%3E%3C/g%3E%3Cg transform='rotate(15 275 270)'%3E%3Crect x='240' y='220' width='70' height='100' rx='8' fill='none' stroke='%23334155' stroke-width='3'/%3E%3Ctext x='255' y='285' fill='%233b82f6' font-family='sans-serif' font-size='48'%3E%E2%99%A0%3C/text%3E%3C/g%3E%3Ctext x='180' y='100' fill='%23f43f5e' font-family='sans-serif' font-size='56'%3E%E2%99%A6%3C/text%3E%3Ctext x='70' y='320' fill='%2314b8a6' font-family='sans-serif' font-size='56'%3E%E2%99%A3%3C/text%3E%3Ctext x='300' y='120' fill='%238b5cf6' font-family='sans-serif' font-size='72' font-weight='bold'%3E%C3%97%3C/text%3E%3Ctext x='120' y='240' fill='%236366f1' font-family='sans-serif' font-size='72' font-weight='bold'%3E+%3C/text%3E%3Ctext x='320' y='320' fill='%2310b981' font-family='sans-serif' font-size='72' font-weight='bold'%3E%C3%B7%3C/text%3E%3Ctext x='200' y='360' fill='%23f59e0b' font-family='sans-serif' font-size='72' font-weight='bold'%3E-%3C/text%3E%3Ctext x='140' y='210' fill='%2394a3b8' font-family='sans-serif' font-size='120' font-weight='900' opacity='0.3' transform='rotate(-5 200 200)'%3E24%3C/text%3E%3C/g%3E%3C/svg%3E")
          `,
          backgroundSize: '200px 200px, 400px 400px',
          backgroundPosition: '0 0, center center'
        }}
      />
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
