export function getSudokuRoomChannelName(roomId: string): string {
  return `private-sudoku-room-${roomId}`
}

export function parseSudokuRoomIdFromChannelName(channelName: string): string | null {
  const match = /^private-sudoku-room-([A-Z0-9]{6})$/.exec(channelName)
  return match ? match[1] : null
}
