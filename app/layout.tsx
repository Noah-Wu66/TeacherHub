import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/platform/auth/AuthProvider'
import PlatformFloatingEntry from '@/components/platform/auth/PlatformFloatingEntry'

export const metadata: Metadata = {
  title: '李雪教学工具集',
  description: '集合了多个教学工具的统一平台',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <PlatformFloatingEntry />
        </AuthProvider>
      </body>
    </html>
  )
}
