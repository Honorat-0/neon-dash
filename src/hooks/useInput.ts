import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { CONFIG } from '../game/config'
import { runtime } from '../game/runtime'
import { useGameStore } from '../game/store'
import { sfx, unlockAudio } from '../game/sfx'

export function moveLane(dir: -1 | 1) {
  const next = Math.max(-1, Math.min(1, runtime.lane + dir))
  if (next !== runtime.lane) {
    runtime.lane = next
    sfx.swish()
  }
}

export function queueJump() {
  runtime.jumpQueuedAt = runtime.elapsed
}

export function tryStart() {
  const { phase, start, gameOverAt } = useGameStore.getState()
  if (phase === 'playing' || phase === 'paused') return
  if (phase === 'gameover' && performance.now() - gameOverAt < CONFIG.RESTART_LOCKOUT) return
  unlockAudio()
  start()
  sfx.start()
}

/** Keyboard controls (global) + pointer/touch gesture handlers for the overlay. */
export function useInput() {
  const pointer = useRef<{ x: number; y: number; t: number; id: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const code = e.code
      const isLeft = code === 'ArrowLeft' || code === 'KeyA'
      const isRight = code === 'ArrowRight' || code === 'KeyD'
      const isJump = code === 'ArrowUp' || code === 'KeyW' || code === 'Space'
      const isStart = code === 'Enter' || code === 'Space'
      const isPause = code === 'Escape' || code === 'KeyP'
      const isMute = code === 'KeyM'

      if (isLeft || isRight || isJump || isStart || isPause) e.preventDefault()
      if (e.repeat) return

      const { phase, pause, resume, toggleMute } = useGameStore.getState()

      if (isMute) {
        toggleMute()
        return
      }

      if (phase === 'playing') {
        unlockAudio()
        if (isLeft) moveLane(-1)
        else if (isRight) moveLane(1)
        else if (isJump) queueJump()
        else if (isPause) pause()
      } else if (phase === 'paused') {
        if (isPause || isStart) resume()
      } else if (isStart || isJump) {
        tryStart()
      }
    }

    const onBlur = () => useGameStore.getState().pause()
    const onVisibility = () => {
      if (document.hidden) useGameStore.getState().pause()
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!e.isPrimary) return
    unlockAudio()
    pointer.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }
  }

  const onPointerUp = (e: ReactPointerEvent) => {
    const p = pointer.current
    if (!p || p.id !== e.pointerId) return
    pointer.current = null

    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    const dist = Math.hypot(dx, dy)
    const { phase, resume } = useGameStore.getState()

    if (phase === 'paused') {
      resume()
      return
    }
    if (phase !== 'playing') {
      tryStart()
      return
    }

    if (dist < 14) {
      queueJump()
    } else if (Math.abs(dx) > Math.abs(dy)) {
      moveLane(dx > 0 ? 1 : -1)
    } else if (dy < 0) {
      queueJump()
    }
  }

  const onPointerCancel = () => {
    pointer.current = null
  }

  return { onPointerDown, onPointerUp, onPointerCancel }
}
