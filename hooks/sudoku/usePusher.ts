'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Channel } from 'pusher-js'
import { getSudokuPusherClient } from '@/lib/sudoku/pusherClient'

export function useSudokuPusher(channelName: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<Channel | null>(null)
  const handlersRef = useRef<Map<string, (data: unknown) => void>>(new Map())

  useEffect(() => {
    if (!channelName) return

    const pusher = getSudokuPusherClient()
    const channel = pusher.subscribe(channelName)
    channelRef.current = channel

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true)
    })

    channel.bind('pusher:subscription_error', () => {
      setIsConnected(false)
    })

    handlersRef.current.forEach((handler, event) => {
      channel.bind(event, handler)
    })

    return () => {
      handlersRef.current.forEach((handler, event) => {
        channel.unbind(event, handler)
      })
      pusher.unsubscribe(channelName)
      channelRef.current = null
      setIsConnected(false)
    }
  }, [channelName])

  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    handlersRef.current.set(event, handler)
    if (channelRef.current) {
      channelRef.current.bind(event, handler)
    }
    return () => {
      handlersRef.current.delete(event)
      if (channelRef.current) {
        channelRef.current.unbind(event, handler)
      }
    }
  }, [])

  return { isConnected, on }
}
