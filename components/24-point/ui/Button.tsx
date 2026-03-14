'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-200 active:shadow-sm active:bg-indigo-700',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm active:bg-gray-100',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 active:bg-gray-200',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 active:bg-rose-700',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200 active:bg-emerald-700',
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
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
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
