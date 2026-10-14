import { useGameStore } from './store'

type OscType = OscillatorType

let ctx: AudioContext | null = null
let master: GainNode | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Call from a user gesture to unlock audio on mobile browsers. */
export function unlockAudio() {
  getCtx()
}

const canPlay = () => !useGameStore.getState().muted

function tone(freq: number, duration: number, type: OscType, volume: number, delay = 0, endFreq?: number) {
  const c = getCtx()
  if (!c || !master) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(master)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noise(duration: number, volume: number, cutoff: number, delay = 0) {
  const c = getCtx()
  if (!c || !master) return
  const t0 = c.currentTime + delay
  const length = Math.max(1, Math.floor(c.sampleRate * duration))
  const buffer = c.createBuffer(1, length, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(cutoff, t0)
  filter.frequency.exponentialRampToValueAtTime(Math.max(60, cutoff * 0.15), t0 + duration)
  const gain = c.createGain()
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  src.connect(filter).connect(gain).connect(master)
  src.start(t0)
  src.stop(t0 + duration + 0.02)
}

export const sfx = {
  coin() {
    if (!canPlay()) return
    tone(988, 0.07, 'square', 0.05)
    tone(1480, 0.14, 'square', 0.05, 0.06)
  },
  jump() {
    if (!canPlay()) return
    tone(260, 0.18, 'sine', 0.12, 0, 640)
    noise(0.08, 0.03, 3000)
  },
  land() {
    if (!canPlay()) return
    noise(0.07, 0.05, 900)
  },
  swish() {
    if (!canPlay()) return
    noise(0.09, 0.04, 2400)
    tone(520, 0.08, 'triangle', 0.03, 0, 380)
  },
  crash() {
    if (!canPlay()) return
    noise(0.6, 0.35, 700)
    tone(120, 0.5, 'sawtooth', 0.18, 0, 35)
    tone(70, 0.6, 'square', 0.1, 0.05, 25)
  },
  start() {
    if (!canPlay()) return
    tone(440, 0.1, 'square', 0.05)
    tone(660, 0.1, 'square', 0.05, 0.1)
    tone(880, 0.2, 'square', 0.06, 0.2)
  },
  click() {
    if (!canPlay()) return
    tone(700, 0.05, 'square', 0.03)
  },
}
