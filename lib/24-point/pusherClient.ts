import PusherClient from 'pusher-js'

let pusherClientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: '/24-point/api/pusher/auth',
      }
    )
  }
  return pusherClientInstance
}
