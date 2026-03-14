import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '数你最棒 - 小学数学教育',
  description: '为 1-6 年级小朋友创作的数学乐园',
}

export const viewport: Viewport = {
  maximumScale: 5,
  userScalable: true,
}

export default function MathLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="math-app bg-bg text-text min-h-screen flex justify-center items-start p-3 sm:p-5">
      {children}
    </div>
  )
}
