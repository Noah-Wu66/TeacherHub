'use client'

import { useAuth } from '@/components/platform/auth/AuthProvider'

export function useNickname() {
  const { user, loading } = useAuth()
  const nickname = user?.displayName || ''
  const setNickname = () => undefined
  const clearNickname = () => undefined

  return {
    nickname,
    setNickname,
    clearNickname,
    isReady: !loading,
    hasNickname: !!nickname,
  }
}
