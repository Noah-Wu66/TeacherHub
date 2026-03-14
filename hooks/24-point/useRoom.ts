'use client'

import { useState, useCallback } from 'react'
import type { Room } from '@/types/24-point'

interface RoomResponse {
  room: Room
  playerId: string
}

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = useCallback(async (roomName: string, nickname: string, totalRounds = 5, timePerRound = 60): Promise<RoomResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/24-point/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, nickname, totalRounds, timePerRound }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '创建房间失败')
      }
      const data = await res.json()
      setRoom(data.room)
      return { room: data.room, playerId: data.playerId }
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建房间失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const joinRoom = useCallback(async (roomId: string, nickname: string): Promise<RoomResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/24-point/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', nickname }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '加入房间失败')
      }
      const data = await res.json()
      setRoom(data.room)
      return { room: data.room, playerId: data.playerId }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加入房间失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRoom = useCallback(async (roomId: string): Promise<Room | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/24-point/api/rooms/${roomId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '房间不存在')
      }
      const data = await res.json()
      setRoom(data.room)
      return data.room
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取房间失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRooms = useCallback(async (): Promise<Room[]> => {
    try {
      const res = await fetch('/24-point/api/rooms')
      if (!res.ok) return []
      const data = await res.json()
      return data.rooms || []
    } catch {
      return []
    }
  }, [])

  return {
    room,
    setRoom,
    loading,
    error,
    createRoom,
    joinRoom,
    fetchRoom,
    fetchRooms,
  }
}
