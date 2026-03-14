'use client'

import { useState, useEffect } from 'react'

const NICKNAME_KEY = '24point-nickname'

export function useNickname() {
  const [nickname, setNicknameState] = useState<string>('')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(NICKNAME_KEY)
    if (stored) {
      setNicknameState(stored)
    }
    setIsReady(true)
  }, [])

  const setNickname = (name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem(NICKNAME_KEY, trimmed)
      setNicknameState(trimmed)
    }
  }

  const clearNickname = () => {
    localStorage.removeItem(NICKNAME_KEY)
    setNicknameState('')
  }

  return {
    nickname,
    setNickname,
    clearNickname,
    isReady,
    hasNickname: !!nickname,
  }
}
