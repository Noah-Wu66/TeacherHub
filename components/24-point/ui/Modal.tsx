'use client'

import { type ReactNode, useEffect, useCallback } from 'react'

interface ModalProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  title?: string
  closable?: boolean
}

export default function Modal({ open, onClose, children, title, closable = true }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable && onClose) {
        onClose()
      }
    },
    [closable, onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closable ? onClose : undefined}
      />
      {/* 弹窗内容 — 移动端从底部滑入，桌面端居中 */}
      <div
        className="
          relative z-10 w-full sm:max-w-md md:max-w-lg
          bg-white/95 backdrop-blur-xl
          rounded-t-3xl sm:rounded-3xl
          border border-white/50 shadow-2xl shadow-black/10
          p-5 sm:p-6 md:p-8
          pb-[max(20px,env(safe-area-inset-bottom))]
          sm:pb-6 md:pb-8
          animate-in zoom-in-95 fade-in duration-300
          max-h-[85dvh] overflow-y-auto overscroll-contain
        "
      >
        {title && (
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
        )}
        {closable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
