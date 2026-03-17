import PusherClient from 'pusher-js'

let pusherClientInstance: PusherClient | null = null

export function getSudokuPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/sudoku/api/pusher/auth',
    })
  }
  return pusherClientInstance
}
