// ============================================
// 全局类型定义
// ============================================

// --- 玩家 ---
export type PlayerRole = 'player' | 'observer'

export interface Player {
  id: string
  accountId: string
  accountType: 'formal' | 'guest'
  displayName: string
  nickname: string
  score: number
  isHost: boolean
  connected: boolean
  role: PlayerRole
}

// --- 游戏模式 ---
export type GameMode = 'solo' | 'vs-ai' | 'multiplayer'

// --- AI 难度 ---
export type AiDifficulty = 'easy' | 'normal' | 'hard' | 'adaptive'

export const AI_CONFIG: Record<AiDifficulty, { label: string; minTime: number; maxTime: number; accuracy: number; description: string }> = {
  easy:   { label: '简单', minTime: 8000,  maxTime: 15000, accuracy: 0.7,  description: '思考较慢，偶尔出错' },
  normal: { label: '普通', minTime: 5000,  maxTime: 10000, accuracy: 0.9,  description: '速度适中，较为准确' },
  hard:   { label: '困难', minTime: 2000,  maxTime: 5000,  accuracy: 0.98, description: '反应极快，几乎不出错' },
  adaptive: { label: '自适应', minTime: 5000, maxTime: 10000, accuracy: 0.9, description: '会根据你的表现自动调整强弱' },
}

// --- 房间 ---
export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface RoundResult {
  round: number
  numbers: number[]
  winner: string | null
  winnerExpression: string | null
  timeUsed: number | null
}

export interface Room {
  roomId: string
  roomName: string
  status: RoomStatus
  players: Player[]
  currentRound: number
  totalRounds: number
  timePerRound: number
  currentNumbers: number[]
  roundResults: RoundResult[]
  createdAt: string
  updatedAt: string
}

// --- 游戏状态 ---
export interface GameState {
  numbers: number[]
  expression: string
  usedNumbers: number[]
  score: number
  opponentScore: number
  round: number
  totalRounds: number
  timeLeft: number
  feedback: 'success' | 'error' | null
  isFinished: boolean
}

// --- API 请求/响应 ---
export interface CreateRoomRequest {
  roomName: string
  nickname: string
  totalRounds?: number
  timePerRound?: number
}

export interface JoinRoomRequest {
  nickname: string
}

export interface SubmitAnswerRequest {
  roomId?: string
  expression: string
  numbers: number[]
  usedNumbers: number[]
  playerId?: string
}

export interface SubmitAnswerResponse {
  isCorrect: boolean
  error?: string
  result?: number
}

// --- Pusher 事件 ---
export interface PusherPlayerJoinedData {
  player: Player
  players: Player[]
}

export interface PusherGameStartData {
  numbers: number[]
  round: number
  totalRounds: number
  timePerRound: number
}

export interface PusherExpressionUpdateData {
  playerId: string
  expression: string
}

export interface PusherAnswerSubmittedData {
  playerId: string
  nickname: string
  isCorrect: boolean
  expression: string
}

export interface PusherRoundEndData {
  round: number
  winner: string | null
  winnerNickname: string | null
  winnerExpression: string | null
  scores: Record<string, number>
  nextNumbers?: number[]
}

export interface PusherGameEndData {
  scores: Record<string, number>
  winner: string | null
  winnerNickname: string | null
  roundResults: RoundResult[]
}

export interface PusherRoleChangedData {
  playerId: string
  role: PlayerRole
  players: Player[]
}

export interface PusherSettingsUpdatedData {
  totalRounds: number
  timePerRound: number
}

export interface PusherPlayerSurrenderedData {
  playerId: string
  nickname: string
  players: Player[]
}
