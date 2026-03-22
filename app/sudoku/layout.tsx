import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '数独挑战',
  description: '数独教学工具，支持单人闯关、教学陪练、双人竞速',
}

export const viewport: Viewport = {
  themeColor: '#f4fbff',
}

export default function SudokuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-slate-900 text-slate-100 overflow-hidden relative selection:bg-sky-500/30">
      {/* 沉浸式深青色神秘光晕 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
      
      {/* 数独九宫格网纹背景SVG */}
      <div 
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Cpath stroke='rgba(255,255,255,0.4)' stroke-width='1' d='M50 0v150M100 0v150M0 50h150M0 100h150' /%3E%3Cpath stroke='rgba(255,255,255,0.8)' stroke-width='2' d='M0 0h150v150H0z' /%3E%3C/svg%3E")`, backgroundSize: '150px 150px' }} 
      />
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
