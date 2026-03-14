export function getRoomChannelName(roomId: string): string {
  return `private-room-${roomId}`
}

export function parseRoomIdFromChannelName(channelName: string): string | null {
  const match = /^private-room-([A-Z0-9]{6})$/.exec(channelName)
  return match ? match[1] : null
}
