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
      
      {/* 飘浮的数学符号底纹 (Base64 SVG pattern, 颜色换为浅紫偏灰) */}
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ctext x='20' y='30' fill='%236366f1' fill-opacity='0.1' font-family='sans-serif' font-size='24' font-weight='bold'%3E+%3C/text%3E%3Ctext x='80' y='80' fill='%23a855f7' fill-opacity='0.1' font-family='sans-serif' font-size='24' font-weight='bold'%3E%C3%97%3C/text%3E%3Ctext x='20' y='100' fill='%2338bdf8' fill-opacity='0.1' font-family='sans-serif' font-size='24' font-weight='bold'%3E%C3%B7%3C/text%3E%3Ctext x='80' y='30' fill='%236366f1' fill-opacity='0.1' font-family='sans-serif' font-size='24' font-weight='bold'%3E-%3C/text%3E%3C/svg%3E")`, backgroundSize: '120px 120px' }} 
      />
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
