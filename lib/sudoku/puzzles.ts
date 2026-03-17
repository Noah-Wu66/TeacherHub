import type { SudokuDifficulty, SudokuPuzzle, SudokuSize } from '@/types/sudoku'

const PUZZLES: SudokuPuzzle[] = [
  {
    id: '4x4-easy-1',
    title: '入门第 1 关',
    size: '4x4',
    difficulty: 'easy',
    order: 1,
    initial: [
      [1, 0, 3, 0],
      [0, 4, 0, 2],
      [2, 0, 4, 0],
      [0, 3, 0, 1],
    ],
    solution: [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ],
  },
  {
    id: '4x4-normal-1',
    title: '入门第 2 关',
    size: '4x4',
    difficulty: 'normal',
    order: 2,
    initial: [
      [0, 0, 3, 4],
      [3, 0, 0, 0],
      [0, 1, 0, 3],
      [4, 0, 2, 0],
    ],
    solution: [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ],
  },
  {
    id: '4x4-hard-1',
    title: '入门第 3 关',
    size: '4x4',
    difficulty: 'hard',
    order: 3,
    initial: [
      [0, 0, 0, 4],
      [0, 4, 0, 0],
      [0, 0, 4, 0],
      [4, 0, 0, 0],
    ],
    solution: [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ],
  },
  {
    id: '6x6-easy-1',
    title: '进阶第 1 关',
    size: '6x6',
    difficulty: 'easy',
    order: 1,
    initial: [
      [1, 0, 3, 0, 5, 0],
      [0, 5, 0, 1, 0, 3],
      [2, 0, 4, 0, 6, 0],
      [0, 6, 0, 2, 0, 4],
      [3, 0, 5, 0, 1, 0],
      [0, 1, 0, 3, 0, 5],
    ],
    solution: [
      [1, 2, 3, 4, 5, 6],
      [4, 5, 6, 1, 2, 3],
      [2, 3, 4, 5, 6, 1],
      [5, 6, 1, 2, 3, 4],
      [3, 4, 5, 6, 1, 2],
      [6, 1, 2, 3, 4, 5],
    ],
  },
  {
    id: '6x6-normal-1',
    title: '进阶第 2 关',
    size: '6x6',
    difficulty: 'normal',
    order: 2,
    initial: [
      [1, 0, 0, 4, 0, 0],
      [0, 5, 0, 0, 2, 0],
      [0, 0, 4, 0, 0, 1],
      [5, 0, 0, 2, 0, 0],
      [0, 4, 0, 0, 1, 0],
      [0, 0, 2, 0, 0, 5],
    ],
    solution: [
      [1, 2, 3, 4, 5, 6],
      [4, 5, 6, 1, 2, 3],
      [2, 3, 4, 5, 6, 1],
      [5, 6, 1, 2, 3, 4],
      [3, 4, 5, 6, 1, 2],
      [6, 1, 2, 3, 4, 5],
    ],
  },
  {
    id: '6x6-hard-1',
    title: '进阶第 3 关',
    size: '6x6',
    difficulty: 'hard',
    order: 3,
    initial: [
      [0, 0, 3, 0, 0, 6],
      [4, 0, 0, 0, 2, 0],
      [0, 3, 0, 5, 0, 0],
      [0, 0, 1, 0, 3, 0],
      [3, 0, 0, 0, 0, 2],
      [0, 1, 0, 3, 0, 0],
    ],
    solution: [
      [1, 2, 3, 4, 5, 6],
      [4, 5, 6, 1, 2, 3],
      [2, 3, 4, 5, 6, 1],
      [5, 6, 1, 2, 3, 4],
      [3, 4, 5, 6, 1, 2],
      [6, 1, 2, 3, 4, 5],
    ],
  },
  {
    id: '9x9-easy-1',
    title: '挑战第 1 关',
    size: '9x9',
    difficulty: 'easy',
    order: 1,
    initial: [
      [1, 0, 3, 0, 5, 0, 7, 0, 9],
      [0, 5, 0, 7, 0, 9, 0, 2, 0],
      [7, 0, 9, 0, 2, 0, 4, 0, 6],
      [0, 3, 0, 5, 0, 7, 0, 9, 0],
      [5, 0, 7, 0, 9, 0, 2, 0, 4],
      [0, 9, 0, 2, 0, 4, 0, 6, 0],
      [3, 0, 5, 0, 7, 0, 9, 0, 2],
      [0, 7, 0, 9, 0, 2, 0, 4, 0],
      [9, 0, 2, 0, 4, 0, 6, 0, 8],
    ],
    solution: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5, 6, 7, 8, 9, 1],
      [5, 6, 7, 8, 9, 1, 2, 3, 4],
      [8, 9, 1, 2, 3, 4, 5, 6, 7],
      [3, 4, 5, 6, 7, 8, 9, 1, 2],
      [6, 7, 8, 9, 1, 2, 3, 4, 5],
      [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ],
  },
  {
    id: '9x9-normal-1',
    title: '挑战第 2 关',
    size: '9x9',
    difficulty: 'normal',
    order: 2,
    initial: [
      [1, 0, 0, 4, 0, 0, 7, 0, 0],
      [0, 5, 0, 0, 8, 0, 0, 2, 0],
      [0, 0, 9, 0, 0, 3, 0, 0, 6],
      [2, 0, 0, 5, 0, 0, 8, 0, 0],
      [0, 6, 0, 0, 9, 0, 0, 3, 0],
      [0, 0, 1, 0, 0, 4, 0, 0, 7],
      [3, 0, 0, 6, 0, 0, 9, 0, 0],
      [0, 7, 0, 0, 1, 0, 0, 4, 0],
      [0, 0, 2, 0, 0, 5, 0, 0, 8],
    ],
    solution: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5, 6, 7, 8, 9, 1],
      [5, 6, 7, 8, 9, 1, 2, 3, 4],
      [8, 9, 1, 2, 3, 4, 5, 6, 7],
      [3, 4, 5, 6, 7, 8, 9, 1, 2],
      [6, 7, 8, 9, 1, 2, 3, 4, 5],
      [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ],
  },
  {
    id: '9x9-hard-1',
    title: '挑战第 3 关',
    size: '9x9',
    difficulty: 'hard',
    order: 3,
    initial: [
      [0, 0, 3, 0, 0, 6, 0, 0, 9],
      [0, 5, 0, 0, 8, 0, 0, 2, 0],
      [7, 0, 0, 1, 0, 0, 4, 0, 0],
      [0, 3, 0, 0, 6, 0, 0, 9, 0],
      [5, 0, 0, 8, 0, 1, 0, 0, 4],
      [0, 9, 0, 0, 3, 0, 0, 6, 0],
      [0, 0, 5, 0, 7, 0, 9, 0, 0],
      [0, 7, 0, 0, 1, 0, 0, 4, 0],
      [9, 0, 0, 3, 0, 0, 6, 0, 0],
    ],
    solution: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5, 6, 7, 8, 9, 1],
      [5, 6, 7, 8, 9, 1, 2, 3, 4],
      [8, 9, 1, 2, 3, 4, 5, 6, 7],
      [3, 4, 5, 6, 7, 8, 9, 1, 2],
      [6, 7, 8, 9, 1, 2, 3, 4, 5],
      [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ],
  },
]

export function getAllSudokuPuzzles(): SudokuPuzzle[] {
  return PUZZLES.map((item) => ({
    ...item,
    initial: item.initial.map((row) => [...row]),
    solution: item.solution.map((row) => [...row]),
  }))
}

export function getSudokuPuzzleById(id: string): SudokuPuzzle | undefined {
  return getAllSudokuPuzzles().find((item) => item.id === id)
}

export function getSudokuPuzzlesBySize(size: SudokuSize): SudokuPuzzle[] {
  return getAllSudokuPuzzles()
    .filter((item) => item.size === size)
    .sort((a, b) => a.order - b.order)
}

export function getSudokuPuzzlesBySizeAndDifficulty(size: SudokuSize, difficulty: SudokuDifficulty): SudokuPuzzle[] {
  return getAllSudokuPuzzles()
    .filter((item) => item.size === size && item.difficulty === difficulty)
    .sort((a, b) => a.order - b.order)
}

export function pickSudokuPuzzle(size: SudokuSize, difficulty: SudokuDifficulty): SudokuPuzzle {
  const puzzles = getSudokuPuzzlesBySizeAndDifficulty(size, difficulty)
  if (puzzles.length === 0) {
    throw new Error(`未找到数独题目：${size} ${difficulty}`)
  }
  return puzzles[Math.floor(Math.random() * puzzles.length)]
}
