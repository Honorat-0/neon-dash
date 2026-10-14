import { laneX } from './runtime'

export type EntityType = 'block' | 'bar' | 'wall' | 'coin'

export interface SpawnItem {
  type: EntityType
  x: number
  y: number
  /** distance beyond the pattern origin (positive = further from the player) */
  dz: number
}

export interface Pattern {
  items: SpawnItem[]
  length: number
}

/** Half-extents for AABB collision tests, per entity type. */
export const HALF_EXTENTS: Record<EntityType, [number, number, number]> = {
  block: [0.7, 1.0, 0.6],
  bar: [3.2, 0.2, 0.25],
  wall: [1.7, 1.5, 0.3],
  coin: [0.5, 0.5, 0.5],
}

export const POOL_SIZES: Record<EntityType, number> = {
  block: 28,
  bar: 14,
  wall: 14,
  coin: 90,
}

const LANES = [-1, 0, 1]
const rnd = (n: number) => Math.floor(Math.random() * n)
const pick = <T>(arr: T[]): T => arr[rnd(arr.length)]
const pickLane = () => rnd(3) - 1
const otherLanes = (l: number) => LANES.filter((x) => x !== l)

const block = (lane: number, dz: number): SpawnItem => ({ type: 'block', x: laneX(lane), y: 1.0, dz })
const bar = (dz: number): SpawnItem => ({ type: 'bar', x: 0, y: 0.45, dz })
const wall = (side: -1 | 1, dz: number): SpawnItem => ({ type: 'wall', x: side, y: 1.5, dz })

const coinLine = (lane: number, from: number, count: number, step = 2, y = 0.75): SpawnItem[] =>
  Array.from({ length: count }, (_, i) => ({ type: 'coin', x: laneX(lane), y, dz: from + i * step }))

const coinArc = (lane: number, center: number): SpawnItem[] => {
  const x = laneX(lane)
  return [
    { type: 'coin', x, y: 0.9, dz: center - 3 },
    { type: 'coin', x, y: 1.6, dz: center - 1.5 },
    { type: 'coin', x, y: 1.95, dz: center },
    { type: 'coin', x, y: 1.6, dz: center + 1.5 },
    { type: 'coin', x, y: 0.9, dz: center + 3 },
  ]
}

// ---------- Pattern builders ----------

const singleBlock = (): Pattern => {
  const l = pickLane()
  return { items: [block(l, 4), ...coinLine(pick(otherLanes(l)), 0, 5)], length: 8 }
}

const doubleBlock = (): Pattern => {
  const free = pickLane()
  return { items: [...otherLanes(free).map((l) => block(l, 4)), ...coinLine(free, 0, 5)], length: 8 }
}

const jumpBar = (): Pattern => {
  const l = pickLane()
  return { items: [bar(3), ...coinArc(l, 3)], length: 6 }
}

export const coinTrail = (): Pattern => {
  return { items: coinLine(pickLane(), 0, 6), length: 10 }
}

const zigzag = (): Pattern => {
  const a = pickLane()
  const b = pick(otherLanes(a))
  return { items: [block(a, 0), block(b, 9), ...coinLine(pick(otherLanes(b)), 7, 3)], length: 11 }
}

const wallPass = (): Pattern => {
  const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1
  return { items: [wall(side, 4), ...coinLine(-side, 0, 5)], length: 8 }
}

const barThenBlock = (): Pattern => {
  const l = pickLane()
  return { items: [bar(0), block(l, 11), ...coinLine(pick(otherLanes(l)), 9, 3)], length: 13 }
}

const snake = (): Pattern => {
  const dir = Math.random() < 0.5 ? 1 : -1
  return {
    items: [...coinLine(-dir, 0, 2), ...coinLine(0, 4, 2), ...coinLine(dir, 8, 2)],
    length: 10,
  }
}

const doubleBar = (): Pattern => {
  return { items: [bar(0), bar(13), ...coinArc(pickLane(), 13)], length: 15 }
}

const gauntlet = (): Pattern => {
  const free1 = pickLane()
  const free2 = pick(otherLanes(free1))
  return {
    items: [
      ...otherLanes(free1).map((l) => block(l, 0)),
      ...coinLine(free1, 0, 2),
      ...otherLanes(free2).map((l) => block(l, 11)),
      ...coinLine(free2, 11, 2),
    ],
    length: 13,
  }
}

const wallThenBar = (): Pattern => {
  const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1
  return { items: [wall(side, 0), bar(11), ...coinArc(-side, 11)], length: 13 }
}

type Weighted = { build: () => Pattern; weight: (d: number) => number }

const TABLE: Weighted[] = [
  { build: singleBlock, weight: () => 3 },
  { build: jumpBar, weight: () => 3 },
  { build: coinTrail, weight: () => 1.5 },
  { build: snake, weight: () => 1.5 },
  { build: doubleBlock, weight: (d) => 1 + 2 * d },
  { build: wallPass, weight: (d) => 1 + 2 * d },
  { build: zigzag, weight: (d) => 0.5 + 2 * d },
  { build: barThenBlock, weight: (d) => 2.5 * d },
  { build: doubleBar, weight: (d) => 2 * d },
  { build: gauntlet, weight: (d) => (d > 0.35 ? 3 * d : 0) },
  { build: wallThenBar, weight: (d) => (d > 0.25 ? 2.5 * d : 0) },
]

let lastIndex = -1

/** Pick a difficulty-weighted random pattern, avoiding immediate repeats. */
export function nextPattern(d: number): Pattern {
  const weights = TABLE.map((t, i) => (i === lastIndex ? 0 : t.weight(d)))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < TABLE.length; i++) {
    r -= weights[i]
    if (r <= 0) {
      lastIndex = i
      return TABLE[i].build()
    }
  }
  lastIndex = 0
  return TABLE[0].build()
}
