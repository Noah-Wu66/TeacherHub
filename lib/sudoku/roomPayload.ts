import { cloneSudokuBoard } from '@/lib/sudoku/board'
import type { SudokuPuzzle } from '@/types/sudoku'

export const SUDOKU_PLAYER_ACTIVE_WINDOW_MS = 25_000

export function toClientSudokuPuzzle(puzzle: SudokuPuzzle | null): SudokuPuzzle | null {
  if (!puzzle) {
    return null
  }

  return {
    ...puzzle,
    initial: cloneSudokuBoard(puzzle.initial),
    solution: [],
  }
}

export function toClientSudokuRoom<T extends { puzzle?: SudokuPuzzle | null }>(room: T): T {
  const roomWithToObject = room as T & { toObject?: () => T }
  const plainRoom =
    typeof roomWithToObject.toObject === 'function'
      ? roomWithToObject.toObject()
      : room

  return {
    ...plainRoom,
    puzzle: plainRoom.puzzle ? toClientSudokuPuzzle(plainRoom.puzzle) : null,
  }
}

export function markSudokuPlayerSeen(player: { connected?: boolean; lastSeenAt?: Date | null }) {
  player.connected = true
  player.lastSeenAt = new Date()
}

export function isSudokuPlayerActive(
  player: { connected?: boolean; lastSeenAt?: Date | string | null },
  referenceTime = Date.now(),
): boolean {
  if (!player?.connected || !player.lastSeenAt) {
    return false
  }

  const lastSeenAt = new Date(player.lastSeenAt).getTime()
  if (!Number.isFinite(lastSeenAt)) {
    return false
  }

  return referenceTime - lastSeenAt <= SUDOKU_PLAYER_ACTIVE_WINDOW_MS
}

export function pruneInactiveWaitingPlayers(room: {
  status: string
  players: Array<{ isHost?: boolean; connected?: boolean; lastSeenAt?: Date | string | null }>
}) {
  if (room.status !== 'waiting') {
    return false
  }

  const referenceTime = Date.now()
  const activePlayers = room.players.filter((player) => isSudokuPlayerActive(player, referenceTime))
  if (activePlayers.length === room.players.length) {
    return false
  }

  room.players = activePlayers as typeof room.players
  if (room.players.length > 0 && !room.players.some((player) => player.isHost)) {
    room.players[0].isHost = true
  }

  return true
}
