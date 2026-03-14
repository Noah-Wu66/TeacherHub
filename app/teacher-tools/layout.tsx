import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '李雪云交互式教学工具',
  description: '李雪云交互式教学工具',
}

export default function TeacherToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
