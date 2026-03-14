import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-3 md:p-4',
  md: 'p-5 md:p-6',
  lg: 'p-7 md:p-8',
}

export default function Card({
  children,
  className = '',
  glass = false,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        ${glass
          ? 'bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/[0.03]'
          : 'bg-white border border-gray-100 shadow-lg shadow-black/[0.04]'}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
