import { create } from 'zustand'
import { resetRuntime } from './runtime'

export type Phase = 'menu' | 'playing' | 'paused' | 'gameover'

const HS_KEY = 'neon-dash-highscore'
const MUTE_KEY = 'neon-dash-muted'

const readHighScore = () => {
  try {
    return Number(localStorage.getItem(HS_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

interface GameState {
  phase: Phase
  score: number
  coins: number
  speed: number
  highScore: number
  isNewBest: boolean
  muted: boolean
  gameOverAt: number
  runs: number
  start: () => void
  pause: () => void
  resume: () => void
  gameOver: (finalScore: number) => void
  setHudStats: (score: number, speed: number) => void
  addCoin: () => void
  toggleMute: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  score: 0,
  coins: 0,
  speed: 0,
  highScore: readHighScore(),
  isNewBest: false,
  muted: readMuted(),
  gameOverAt: 0,
  runs: 0,

  start: () => {
    resetRuntime()
    set((s) => ({ phase: 'playing', score: 0, coins: 0, isNewBest: false, runs: s.runs + 1 }))
  },

  pause: () => {
    if (get().phase === 'playing') set({ phase: 'paused' })
  },

  resume: () => {
    if (get().phase === 'paused') set({ phase: 'playing' })
  },

  gameOver: (finalScore) => {
    const prev = get().highScore
    const isNewBest = finalScore > prev
    const highScore = Math.max(prev, finalScore)
    try {
      localStorage.setItem(HS_KEY, String(highScore))
    } catch {
      /* ignore */
    }
    set({ phase: 'gameover', score: finalScore, highScore, isNewBest, gameOverAt: performance.now() })
  },

  setHudStats: (score, speed) => {
    const s = get()
    if (s.score !== score || s.speed !== speed) set({ score, speed })
  },

  addCoin: () => set((s) => ({ coins: s.coins + 1 })),

  toggleMute: () =>
    set((s) => {
      const muted = !s.muted
      try {
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
      } catch {
        /* ignore */
      }
      return { muted }
    }),
}))
