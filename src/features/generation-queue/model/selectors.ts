import type { GenerationTask, GenType } from '@/entities/generation-task'
import type { StatusFilter, SortOrder, TypeFilter } from './queueReducer'

/**
 * Returns tasks with `queuePosition` recalculated based on current queued order (FIFO).
 * Should be applied before passing tasks to UI to keep positions always accurate.
 */
export function selectTasksWithPositions(tasks: GenerationTask[]): GenerationTask[] {
  let pos = 0
  const sorted = [...tasks].sort((a, b) => a.createdAt - b.createdAt)

  return sorted.map((t) => {
    if (t.status === 'queued') {
      pos += 1
      return { ...t, queuePosition: pos }
    }
    return { ...t, queuePosition: undefined }
  })
}

export interface QueueStats {
  queued: number
  running: number
  done: number
  failed: number
}

export function selectStats(tasks: GenerationTask[]): QueueStats {
  return tasks.reduce<QueueStats>(
    (acc, task) => {
      if (task.status === 'queued') acc.queued += 1
      else if (task.status === 'running') acc.running += 1
      else if (task.status === 'done') acc.done += 1
      else if (task.status === 'failed') acc.failed += 1
      return acc
    },
    { queued: 0, running: 0, done: 0, failed: 0 },
  )
}

const STATUS_SORT_ORDER: Record<GenerationTask['status'], number> = {
  running: 0,
  queued: 1,
  failed: 2,
  canceled: 3,
  done: 4,
}

export function selectFiltered(
  tasks: GenerationTask[],
  filter: StatusFilter,
  sort: SortOrder,
  search: string,
  typeFilter: TypeFilter = 'all',
): GenerationTask[] {
  let result = tasks

  if (filter !== 'all') {
    result = result.filter((t) => t.status === filter)
  }

  if (typeFilter !== 'all') {
    result = result.filter((t) => t.type === typeFilter)
  }

  const q = search.trim().toLowerCase()
  if (q) {
    result = result.filter((t) => t.prompt.toLowerCase().includes(q))
  }

  const sorted = [...result]

  switch (sort) {
    case 'newest':
      sorted.sort((a, b) => b.createdAt - a.createdAt)
      break
    case 'oldest':
      sorted.sort((a, b) => a.createdAt - b.createdAt)
      break
    case 'status':
      sorted.sort(
        (a, b) =>
          STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status] ||
          b.createdAt - a.createdAt,
      )
      break
    case 'progress':
      sorted.sort((a, b) => b.progress - a.progress || b.createdAt - a.createdAt)
      break
  }

  return sorted
}

export function selectActiveCount(tasks: GenerationTask[]): number {
  return tasks.filter((t) => t.status === 'running' || t.status === 'queued').length
}

export function selectAvgProgress(tasks: GenerationTask[]): number {
  const running = tasks.filter((t) => t.status === 'running')
  if (running.length === 0) return 0
  const sum = running.reduce((acc, t) => acc + t.progress, 0)
  return Math.round(sum / running.length)
}

export function selectTopActive(tasks: GenerationTask[], limit = 3): GenerationTask[] {
  const running = tasks.filter((t) => t.status === 'running')
  const queued = tasks
    .filter((t) => t.status === 'queued')
    .sort((a, b) => a.createdAt - b.createdAt)

  return [...running, ...queued].slice(0, limit)
}

/** FIFO list used for drag-and-drop and keyboard reorder — independent of UI filters. */
export function selectQueuedInOrder(tasks: GenerationTask[]): GenerationTask[] {
  return tasks
    .filter((t) => t.status === 'queued')
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function findReorderNeighbor(
  queued: GenerationTask[],
  taskId: string,
  direction: 'up' | 'down',
): GenerationTask | undefined {
  const idx = queued.findIndex((t) => t.id === taskId)
  if (idx === -1) return undefined
  return direction === 'up' ? queued[idx - 1] : queued[idx + 1]
}
