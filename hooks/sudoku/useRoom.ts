'use client'

import { useCallback, useState } from 'react'
import type { SudokuDifficulty, SudokuRoom, SudokuSize } from '@/types/sudoku'

interface RoomResponse {
  room: SudokuRoom
  playerId: string
}

export function useSudokuRoom() {
  const [room, setRoom] = useState<SudokuRoom | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = useCallback(async (roomName: string, size: SudokuSize, difficulty: SudokuDifficulty): Promise<RoomResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/sudoku/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, size, difficulty }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '创建房间失败')
      }
      setRoom(data.room)
      return { room: data.room, playerId: data.playerId }
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建房间失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const joinRoom = useCallback(async (roomId: string): Promise<RoomResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/sudoku/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '加入房间失败')
      }
      setRoom(data.room)
      return { room: data.room, playerId: data.playerId }
    } catch (error) {
      setError(error instanceof Error ? error.message : '加入房间失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRoom = useCallback(async (roomId: string): Promise<SudokuRoom | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/sudoku/api/rooms/${roomId}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '获取房间失败')
      }
      setRoom(data.room)
      return data.room
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取房间失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRooms = useCallback(async (): Promise<SudokuRoom[]> => {
    try {
      const res = await fetch('/sudoku/api/rooms')
      if (!res.ok) {
        return []
      }
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
