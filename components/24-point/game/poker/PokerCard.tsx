'use client'

import React from 'react'

export type Suit = 'spade' | 'heart' | 'club' | 'diamond'

export interface PokerCardProps {
  number: number
  suit: Suit
  disabled?: boolean
  selected?: boolean
  onClick?: () => void
  compact?: boolean
  className?: string
}

const suitSymbols = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦',
}

const suitColors = {
  spade: 'text-slate-800',
  heart: 'text-red-600',
  club: 'text-slate-800',
  diamond: 'text-red-600',
}

function getDisplayNumber(num: number): string {
  if (num === 1) return 'A'
  if (num === 11) return 'J'
  if (num === 12) return 'Q'
  if (num === 13) return 'K'
  return num.toString()
}

export default function PokerCard({
  number,
  suit,
  disabled = false,
  selected = false,
  onClick,
  compact = false,
  className = '',
}: PokerCardProps) {
  const displayNum = getDisplayNumber(number)
  const symbol = suitSymbols[suit]
  const color = suitColors[suit]

  return (
    <button
      onClick={() => !disabled && onClick?.()}
      disabled={disabled}
      className={`
        relative bg-white border-2 border-slate-200 
        flex flex-col items-center justify-center select-none
        transition-all duration-300 ease-out flex-shrink-0
        ${compact 
          ? 'w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 rounded-lg' 
          : 'w-16 h-24 sm:w-[80px] sm:h-[116px] md:w-24 md:h-[140px] rounded-xl'}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed scale-95 shadow-none' 
          : 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] shadow-[0_4px_10px_rgba(0,0,0,0.08)]'}
        ${selected && !disabled
          ? 'ring-4 ring-indigo-400 border-indigo-400 -translate-y-2 shadow-[0_12px_24px_rgba(99,102,241,0.3)]' 
          : ''}
        ${className}
      `}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Top Left */}
      <div className={`absolute top-0.5 left-1 sm:top-1.5 sm:left-1.5 md:top-2 md:left-2 flex flex-col items-center ${color} ${compact ? 'scale-75 origin-top-left' : 'scale-90 sm:scale-100 origin-top-left'}`}>
        <span className="text-xs sm:text-sm md:text-lg font-bold leading-none">{displayNum}</span>
        <span className="text-[10px] sm:text-xs md:text-base leading-none">{symbol}</span>
      </div>

      {/* Center Symbol */}
      <div className={`text-2xl sm:text-3xl md:text-5xl ${color} opacity-80 pointer-events-none`}>
        {symbol}
      </div>

      {/* Bottom Right (inverted) */}
      <div className={`absolute bottom-0.5 right-1 sm:bottom-1.5 sm:right-1.5 md:bottom-2 md:right-2 flex flex-col items-center rotate-180 ${color} ${compact ? 'scale-75 origin-bottom-right' : 'scale-90 sm:scale-100 origin-bottom-right'}`}>
        <span className="text-xs sm:text-sm md:text-lg font-bold leading-none">{displayNum}</span>
        <span className="text-[10px] sm:text-xs md:text-base leading-none">{symbol}</span>
      </div>
    </button>
  )
}
