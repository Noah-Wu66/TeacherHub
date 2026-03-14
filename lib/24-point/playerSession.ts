import type { NextResponse } from 'next/server'
import { requireAnyUser } from '@/lib/platform/auth'

export function setRoomPlayerCookie(_response: NextResponse, _roomId: string, _playerId: string) {
  return
}

export function clearRoomPlayerCookie(_response: NextResponse, _roomId: string) {
  return
}

export async function getAuthenticatedRoomPlayerId(_roomId: string): Promise<string | null> {
  const user = await requireAnyUser()
  return user ? String(user._id) : null
}
