import mongoose, { Schema, type Document } from 'mongoose'

export interface IRoomPlayer {
  id: string
  nickname: string
  score: number
  isHost: boolean
  connected: boolean
  role: 'player' | 'observer'
}

export interface IRoundResult {
  round: number
  numbers: number[]
  winner: string | null
  winnerExpression: string | null
  timeUsed: number | null
}

export interface IRoom extends Document {
  roomId: string
  roomName: string
  status: 'waiting' | 'playing' | 'finished'
  players: IRoomPlayer[]
  currentRound: number
  totalRounds: number
  timePerRound: number
  currentNumbers: number[]
  roundResults: IRoundResult[]
  roundStartedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const RoomPlayerSchema = new Schema<IRoomPlayer>({
  id: { type: String, required: true },
  nickname: { type: String, required: true },
  score: { type: Number, default: 0 },
  isHost: { type: Boolean, default: false },
  connected: { type: Boolean, default: true },
  role: { type: String, enum: ['player', 'observer'], default: 'player' },
}, { _id: false })

const RoundResultSchema = new Schema<IRoundResult>({
  round: { type: Number, required: true },
  numbers: [{ type: Number }],
  winner: { type: String, default: null },
  winnerExpression: { type: String, default: null },
  timeUsed: { type: Number, default: null },
}, { _id: false })

const RoomSchema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  roomName: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  players: [RoomPlayerSchema],
  currentRound: { type: Number, default: 0 },
  totalRounds: { type: Number, default: 5 },
  timePerRound: { type: Number, default: 60 },
  currentNumbers: [{ type: Number }],
  roundResults: [RoundResultSchema],
  roundStartedAt: { type: Date, default: null },
}, {
  timestamps: true,
})

// 自动清理 2 小时前的房间
RoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7200 })

export const Room = mongoose.models.Room as mongoose.Model<IRoom> || mongoose.model<IRoom>('Room', RoomSchema)
