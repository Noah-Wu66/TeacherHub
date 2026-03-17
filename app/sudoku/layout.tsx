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
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(196,181,253,0.24),_transparent_30%),linear-gradient(180deg,_#f7fcff,_#eef7ff)] text-slate-800 selection:bg-sky-200">
      {children}
    </div>
  )
}
