import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '土圭之法 - 古代天文观测模拟器',
  description: '交互式土圭天文观测模拟器，展示春分、夏至、秋分、冬至四个节气的太阳高度角和日影变化',
}

export const viewport: Viewport = {
  maximumScale: 5,
  userScalable: true,
}

export default function TuguiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="font-serif">
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700;900&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  )
}
