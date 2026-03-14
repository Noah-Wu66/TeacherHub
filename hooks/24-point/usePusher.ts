'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getPusherClient } from '@/lib/24-point/pusherClient'
import type { Channel } from 'pusher-js'

export function usePusher(channelName: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<Channel | null>(null)
  const handlersRef = useRef<Map<string, (data: unknown) => void>>(new Map())

  useEffect(() => {
    if (!channelName) return

    const pusher = getPusherClient()
    const channel = pusher.subscribe(channelName)
    channelRef.current = channel

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true)
    })

    channel.bind('pusher:subscription_error', () => {
      setIsConnected(false)
    })

    // 重新绑定之前注册的事件
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

  const trigger = useCallback(async (event: string, data: unknown) => {
    // 通过 API 中转触发服务端事件
    await fetch('/24-point/api/pusher/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, channel: channelRef.current?.name, data }),
    })
  }, [])

  return { isConnected, on, trigger }
}
