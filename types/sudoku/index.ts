export type SudokuSize = '4x4' | '6x6' | '9x9'
export type SudokuDifficulty = 'easy' | 'normal' | 'hard'
export type SudokuRoomStatus = 'waiting' | 'playing' | 'finished'
export type SudokuHintLevel = 'observe' | 'candidates' | 'answer'
export type SudokuBoard = number[][]

export type SudokuSizeConfig = {
  key: SudokuSize
  dimension: number
  boxRows: number
  boxCols: number
  title: string
  subtitle: string
}

export const SUDOKU_SIZE_CONFIG: Record<SudokuSize, SudokuSizeConfig> = {
  '4x4': {
    key: '4x4',
    dimension: 4,
    boxRows: 2,
    boxCols: 2,
    title: '4x4 入门',
    subtitle: '适合先建立数独规则感',
  },
  '6x6': {
    key: '6x6',
    dimension: 6,
    boxRows: 2,
    boxCols: 3,
    title: '6x6 进阶',
    subtitle: '开始练习更完整的排除思路',
  },
  '9x9': {
    key: '9x9',
    dimension: 9,
    boxRows: 3,
    boxCols: 3,
    title: '9x9 挑战',
    subtitle: '标准数独，适合正式闯关',
  },
}

export const SUDOKU_DIFFICULTY_LABELS: Record<SudokuDifficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
}

export interface SudokuPuzzle {
  id: string
  title: string
  size: SudokuSize
  difficulty: SudokuDifficulty
  order: number
  initial: SudokuBoard
  solution: SudokuBoard
}

export interface SudokuHint {
  puzzleId: string
  row: number
  col: number
  level: SudokuHintLevel
  message: string
  candidates: number[]
  answer: number
  focusLabel: string
  boardSignature: string
}

export interface SudokuPlayerProgress {
  board: SudokuBoard
  filledCount: number
  errorCount: number
  completedAt: string | null
}

export interface SudokuPlayer {
  id: string
  accountId: string
  accountType: 'formal' | 'guest'
  displayName: string
  nickname: string
  isHost: boolean
  connected: boolean
  lastSeenAt: string | null
  progress: SudokuPlayerProgress
}

export interface SudokuRoom {
  roomId: string
  roomName: string
  status: SudokuRoomStatus
  size: SudokuSize
  difficulty: SudokuDifficulty
  players: SudokuPlayer[]
  puzzleId: string | null
  puzzle: SudokuPuzzle | null
  winner: string | null
  winnerNickname: string | null
  createdAt: string
  updatedAt: string
  startedAt: string | null
  finishedAt: string | null
}

export interface SudokuCreateRoomRequest {
  roomName: string
  size: SudokuSize
  difficulty: SudokuDifficulty
}

export interface SudokuJoinRoomRequest {
  nickname?: string
}

export interface SudokuProgressRequest {
  board: SudokuBoard
  filledCount: number
  errorCount: number
}

export interface SudokuCompleteRequest extends SudokuProgressRequest {}

export interface SudokuProgressRecord {
  completed: boolean
  bestSeconds: number | null
  lowestErrors: number | null
  lastPlayedAt: string | null
}

export type SudokuProgressStore = Record<string, SudokuProgressRecord>

export interface SudokuPusherPlayerJoinedData {
  players: SudokuPlayer[]
}

export interface SudokuPusherPlayerLeftData {
  playerId: string
  players: SudokuPlayer[]
}

export interface SudokuPusherGameStartData {
  room: SudokuRoom
}

export interface SudokuPusherProgressUpdatedData {
  playerId: string
  filledCount: number
  errorCount: number
  completedAt: string | null
}

export interface SudokuPusherGameEndData {
  winner: string | null
  winnerNickname: string | null
  players: SudokuPlayer[]
}

export interface SudokuPusherSettingsUpdatedData {
  size: SudokuSize
  difficulty: SudokuDifficulty
}

export interface SudokuPusherPlayerSurrenderedData {
  playerId: string
  nickname: string
  players: SudokuPlayer[]
}
