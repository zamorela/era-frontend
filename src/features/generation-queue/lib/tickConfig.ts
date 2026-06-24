import type { GenType } from '@/entities/generation-task'

export interface TickConfig {
  intervalMs: number
  minStep: number
  maxStep: number
}

export const TICK_CONFIG: Record<GenType, TickConfig> = {
  text: { intervalMs: 400, minStep: 5, maxStep: 9 },
  image: { intervalMs: 500, minStep: 4, maxStep: 7 },
  video: { intervalMs: 700, minStep: 1, maxStep: 3 },
  audio: { intervalMs: 600, minStep: 2, maxStep: 4 },
}

/** Rough ETA for UI — average step size and tick interval per type. */
export function estimateRemainingMs(type: GenType, progress: number): number {
  const { intervalMs, minStep, maxStep } = TICK_CONFIG[type]
  const avgStep = (minStep + maxStep) / 2
  const ticksLeft = Math.max(0, (100 - progress) / avgStep)
  return Math.round(ticksLeft * intervalMs)
}
