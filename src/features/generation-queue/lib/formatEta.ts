export function formatEta(ms: number): string {
  if (ms < 60_000) {
    const secs = Math.round(ms / 1000)
    return `≈ ${secs} сек`
  }
  const mins = Math.round(ms / 60_000)
  return `≈ ${mins} мин`
}

export function formatCredits(n: number): string {
  return `${n} кр`
}

export function formatDuration(startedAt: number, completedAt: number): string {
  const ms = completedAt - startedAt
  if (ms < 60_000) {
    const secs = Math.round(ms / 1000)
    return `за ${secs} сек`
  }
  const mins = Math.round(ms / 60_000)
  return `за ${mins} мин`
}

export function formatQueuePosition(pos: number): string {
  return `позиция ${pos} в очереди`
}
