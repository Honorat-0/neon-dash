import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CONFIG } from '../game/config'
import { useGameStore } from '../game/store'
import { useInput } from '../hooks/useInput'
import { sfx } from '../game/sfx'

const fmt = (n: number) => n.toLocaleString('en-US')

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border border-cyan-300/40 bg-cyan-400/10 px-1.5 py-0.5 font-display text-[11px] text-cyan-100 shadow-[0_0_10px_rgba(0,229,255,0.25)]">
      {children}
    </kbd>
  )
}

function CoinIcon({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border-[3px] border-yellow-300 shadow-[0_0_10px_rgba(255,216,74,0.8)] ${className}`}
      aria-hidden
    />
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition hover:border-cyan-300/50 hover:text-cyan-200 active:scale-95"
    >
      {children}
    </button>
  )
}

export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const score = useGameStore((s) => s.score)
  const coins = useGameStore((s) => s.coins)
  const speed = useGameStore((s) => s.speed)
  const highScore = useGameStore((s) => s.highScore)
  const isNewBest = useGameStore((s) => s.isNewBest)
  const muted = useGameStore((s) => s.muted)
  const runs = useGameStore((s) => s.runs)
  const { pause, resume, toggleMute } = useGameStore.getState()

  const handlers = useInput()

  const isTouch = useMemo(() => (typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false), [])

  // coin counter pop animation
  const [coinPop, setCoinPop] = useState(false)
  useEffect(() => {
    if (coins === 0) return
    setCoinPop(true)
    const id = setTimeout(() => setCoinPop(false), 180)
    return () => clearTimeout(id)
  }, [coins])

  const speedPct = Math.max(0, Math.min(1, (speed / 5 - CONFIG.START_SPEED) / (CONFIG.MAX_SPEED - CONFIG.START_SPEED)))
  const playing = phase === 'playing' || phase === 'paused'

  return (
    <div
      className="fixed inset-0 select-none touch-none overflow-hidden text-white"
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-2.5 backdrop-blur-md">
            <div className="font-display text-[10px] tracking-[0.3em] text-cyan-300/80">SCORE</div>
            <div className="font-display text-3xl tabular-nums leading-none text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.6)] sm:text-4xl">
              {fmt(playing ? score : phase === 'gameover' ? score : 0)}
            </div>
          </div>
          <div
            className={`flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-md transition-transform duration-150 ${
              coinPop ? 'scale-110' : 'scale-100'
            }`}
          >
            <CoinIcon />
            <span className="font-display text-sm tabular-nums text-yellow-200">{coins}</span>
            <span className="text-[10px] tracking-widest text-white/40">×{CONFIG.COIN_VALUE}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-2.5 text-right backdrop-blur-md">
            <div className="font-display text-[10px] tracking-[0.3em] text-fuchsia-300/80">BEST</div>
            <div className="font-display text-xl tabular-nums leading-none text-fuchsia-100 sm:text-2xl">{fmt(highScore)}</div>
          </div>
          <div className="flex gap-2">
            {phase === 'playing' && (
              <IconButton label="Pause" onClick={pause}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              </IconButton>
            )}
            <IconButton
              label={muted ? 'Unmute' : 'Mute'}
              onClick={() => {
                toggleMute()
                if (muted) setTimeout(() => sfx.click(), 0)
              }}
            >
              {muted ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="m23 9-6 6M17 9l6 6" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                </svg>
              )}
            </IconButton>
          </div>
        </div>
      </div>

      {/* Speed meter */}
      {playing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-1.5 sm:bottom-7">
          <div className="flex items-center gap-3">
            <span className="font-display text-[10px] tracking-[0.3em] text-white/50">SPEED</span>
            <span className="font-display text-sm tabular-nums text-cyan-200">{speed}</span>
            <span className="text-[10px] tracking-widest text-white/40">KM/H</span>
          </div>
          <div className="h-1.5 w-48 overflow-hidden rounded-full border border-white/10 bg-black/40 sm:w-64">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-300 shadow-[0_0_12px_rgba(0,229,255,0.8)] transition-[width] duration-150"
              style={{ width: `${8 + speedPct * 92}%` }}
            />
          </div>
        </div>
      )}

      {/* Menu */}
      {phase === 'menu' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="animate-float">
            <h1 className="font-display text-5xl font-black tracking-[0.12em] sm:text-7xl md:text-8xl">
              <span className="neon-cyan">NEON</span> <span className="neon-pink">DASH</span>
            </h1>
          </div>
          <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
            Dodge the blocks, leap the bars, grab every ring. The grid only gets faster.
          </p>

          <div className="mt-8 animate-pulse font-display text-sm tracking-[0.3em] text-cyan-200 sm:text-base">
            {isTouch ? 'TAP TO START' : 'PRESS SPACE TO START'}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-left text-xs text-white/70 backdrop-blur-md sm:grid-cols-2 sm:gap-x-8 sm:text-sm">
            {isTouch ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xl">👈👉</span> Swipe left / right to switch lanes
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">👆</span> Tap or swipe up to jump
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Kbd>←</Kbd>
                  <Kbd>→</Kbd>
                  <span className="text-white/40">or</span>
                  <Kbd>A</Kbd>
                  <Kbd>D</Kbd>
                  <span className="ml-1">switch lanes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd>SPACE</Kbd>
                  <span className="text-white/40">or</span>
                  <Kbd>↑</Kbd>
                  <Kbd>W</Kbd>
                  <span className="ml-1">jump</span>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd>P</Kbd>
                  <span className="ml-1">pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd>M</Kbd>
                  <span className="ml-1">mute</span>
                </div>
              </>
            )}
          </div>

          {highScore > 0 && (
            <div className="mt-5 font-display text-xs tracking-[0.25em] text-fuchsia-200/80">
              PERSONAL BEST · {fmt(highScore)}
            </div>
          )}
        </div>
      )}

      {/* Paused */}
      {phase === 'paused' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-6 text-center backdrop-blur-sm">
          <h2 className="font-display text-4xl tracking-[0.3em] text-white sm:text-5xl">PAUSED</h2>
          <p className="mt-4 animate-pulse font-display text-xs tracking-[0.3em] text-cyan-200 sm:text-sm">
            {isTouch ? 'TAP TO RESUME' : 'PRESS P OR SPACE TO RESUME'}
          </p>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => {
              e.stopPropagation()
              resume()
            }}
            className="pointer-events-auto mt-6 rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-6 py-2 font-display text-sm tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/20"
          >
            RESUME
          </button>
        </div>
      )}

      {/* Game over */}
      {phase === 'gameover' && (
        <div key={runs} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="animate-slam">
            <h2 className="neon-pink font-display text-5xl font-black tracking-[0.2em] sm:text-7xl">CRASHED</h2>
          </div>

          <div className="mt-6 flex items-stretch gap-3 sm:gap-4">
            <div className="min-w-32 rounded-2xl border border-white/10 bg-black/45 px-5 py-3 backdrop-blur-md sm:min-w-40">
              <div className="font-display text-[10px] tracking-[0.3em] text-cyan-300/80">SCORE</div>
              <div className="font-display text-3xl tabular-nums text-white sm:text-4xl">{fmt(score)}</div>
            </div>
            <div className="min-w-32 rounded-2xl border border-white/10 bg-black/45 px-5 py-3 backdrop-blur-md sm:min-w-40">
              <div className="font-display text-[10px] tracking-[0.3em] text-yellow-300/80">RINGS</div>
              <div className="flex items-center justify-center gap-2 font-display text-3xl tabular-nums text-yellow-200 sm:text-4xl">
                <CoinIcon className="h-5 w-5" /> {coins}
              </div>
            </div>
          </div>

          {isNewBest ? (
            <div className="mt-5 animate-bounce rounded-full border border-yellow-300/50 bg-yellow-400/15 px-5 py-1.5 font-display text-xs tracking-[0.3em] text-yellow-200 shadow-[0_0_24px_rgba(255,216,74,0.45)]">
              ★ NEW BEST ★
            </div>
          ) : (
            <div className="mt-5 font-display text-xs tracking-[0.25em] text-fuchsia-200/80">BEST · {fmt(highScore)}</div>
          )}

          <div className="mt-8 animate-pulse font-display text-sm tracking-[0.3em] text-cyan-200">
            {isTouch ? 'TAP TO RETRY' : 'PRESS SPACE TO RETRY'}
          </div>
        </div>
      )}
    </div>
  )
}
