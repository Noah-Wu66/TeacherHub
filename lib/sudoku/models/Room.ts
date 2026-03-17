import mongoose, { Schema, type Document } from 'mongoose'
import type { SudokuDifficulty, SudokuPuzzle, SudokuSize } from '@/types/sudoku'

export interface ISudokuPlayerProgress {
  board: number[][]
  filledCount: number
  errorCount: number
  completedAt: Date | null
}

export interface ISudokuRoomPlayer {
  id: string
  accountId: string
  accountType: 'formal' | 'guest'
  displayName: string
  nickname: string
  isHost: boolean
  connected: boolean
  lastSeenAt: Date | null
  progress: ISudokuPlayerProgress
}

export interface ISudokuRoom extends Document {
  roomId: string
  roomName: string
  status: 'waiting' | 'playing' | 'finished'
  size: SudokuSize
  difficulty: SudokuDifficulty
  players: ISudokuRoomPlayer[]
  puzzleId: string | null
  puzzle: SudokuPuzzle | null
  winner: string | null
  winnerNickname: string | null
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const SudokuPlayerProgressSchema = new Schema<ISudokuPlayerProgress>({
  board: { type: [[Number]], default: [] },
  filledCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  completedAt: { type: Date, default: null },
}, { _id: false })

const SudokuRoomPlayerSchema = new Schema<ISudokuRoomPlayer>({
  id: { type: String, required: true },
  accountId: { type: String, required: true, index: true },
  accountType: { type: String, enum: ['formal', 'guest'], required: true },
  displayName: { type: String, required: true },
  nickname: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  connected: { type: Boolean, default: true },
  lastSeenAt: { type: Date, default: null },
  progress: { type: SudokuPlayerProgressSchema, default: () => ({}) },
}, { _id: false })

const SudokuRoomSchema = new Schema<ISudokuRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  roomName: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  size: { type: String, enum: ['4x4', '6x6', '9x9'], required: true },
  difficulty: { type: String, enum: ['easy', 'normal', 'hard'], required: true },
  players: [SudokuRoomPlayerSchema],
  puzzleId: { type: String, default: null },
  puzzle: { type: Schema.Types.Mixed, default: null },
  winner: { type: String, default: null },
  winnerNickname: { type: String, default: null },
  startedAt: { type: Date, default: null },
  finishedAt: { type: Date, default: null },
}, {
  timestamps: true,
})

SudokuRoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7200 })

export const SudokuRoomModel =
  mongoose.models.SudokuRoom as mongoose.Model<ISudokuRoom> ||
  mongoose.model<ISudokuRoom>('SudokuRoom', SudokuRoomSchema)
