'use client'

import { useMemo } from 'react'
import PokerCard, { Suit } from './poker/PokerCard'

interface NumberCardsProps {
  numbers: number[]
  usedNumbers: number[]
  onNumberClick: (num: number) => void
  disabled?: boolean
  compact?: boolean
}

const SUITS: Suit[] = ['spade', 'heart', 'club', 'diamond']

export default function NumberCards({
  numbers,
  usedNumbers,
  onNumberClick,
  disabled = false,
  compact = false,
}: NumberCardsProps) {
  // 分配花色：每回合4张牌恰好分配4种不同的花色
  const cardSuits = useMemo(() => {
    // 如果没有数字（比如还没开始），返回空
    if (numbers.length === 0) return []
    
    // 洗牌算法打乱花色
    const shuffledSuits = [...SUITS]
    for (let i = shuffledSuits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledSuits[i], shuffledSuits[j]] = [shuffledSuits[j], shuffledSuits[i]]
    }
    
    // 如果 numbers 有超过 4 个（理论上24点只有4个），循环使用
    return numbers.map((_, i) => shuffledSuits[i % 4])
  }, [numbers]) // 当 numbers 数组引用改变时（新回合），重新分配花色

  // 计算每个数字的剩余可用次数
  const getAvailableCount = (num: number, index: number) => {
    const sameNumIndices = numbers
      .map((n, i) => (n === num ? i : -1))
      .filter((i) => i !== -1)
    const posInGroup = sameNumIndices.indexOf(index)
    const usedCount = usedNumbers.filter((n) => n === num).length
    return posInGroup >= usedCount
  }

  return (
    <div className={`flex justify-center ${compact ? 'gap-2 sm:gap-3 md:gap-4' : 'gap-3 sm:gap-5 md:gap-6'}`}>
      {numbers.map((num, index) => {
        const available = getAvailableCount(num, index)
        const suit = cardSuits[index] || 'spade'
        
        return (
          <div 
            key={index} 
            className={`transition-all duration-300 ${!available ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
          >
            <PokerCard
              number={num}
              suit={suit}
              onClick={() => !disabled && available && onNumberClick(num)}
              disabled={disabled || !available}
              compact={compact}
            />
          </div>
        )
      })}
    </div>
  )
}
