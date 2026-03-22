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
        rounded-3xl
        ${glass
          ? 'bg-white/70 backdrop-blur-xl border-2 border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
          : 'bg-white border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
