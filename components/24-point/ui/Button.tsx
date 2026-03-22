'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_4px_0_0_rgba(67,56,202,1)] active:shadow-[0_0px_0_0_rgba(67,56,202,1)] active:translate-y-1',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-slate-200 shadow-[0_4px_0_0_rgba(226,232,240,1)] active:shadow-[0_0px_0_0_rgba(226,232,240,1)] active:translate-y-1',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 active:bg-gray-200',
  danger: 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_4px_0_0_rgba(190,18,60,1)] active:shadow-[0_0px_0_0_rgba(190,18,60,1)] active:translate-y-1',
  success: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_0_0_rgba(4,120,87,1)] active:shadow-[0_0px_0_0_rgba(4,120,87,1)] active:translate-y-1',
}

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg min-h-[44px]',
  md: 'px-5 py-2.5 text-base rounded-xl min-h-[44px] sm:min-h-[48px] md:min-h-[52px]',
  lg: 'px-7 py-3 text-lg rounded-2xl min-h-[48px] sm:min-h-[52px] md:min-h-[56px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-bold tracking-wide
        transition-all duration-150 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0]
        select-none cursor-pointer
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
