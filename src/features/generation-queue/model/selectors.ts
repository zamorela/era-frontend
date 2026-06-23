import type { GenerationTask, TaskStatus, GenType } from '@/entities/generation-task'
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
      pos++
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
  return tasks.reduce(
    (acc, task) => {
      if (task.status === 'queued') acc.queued++
      else if (task.status === 'running') acc.running++
      else if (task.status === 'done') acc.done++
      else if (task.status === 'failed') acc.failed++
      return acc
    },
    { queued: 0, running: 0, done: 0, failed: 0 },
  )
}

const STATUS_SORT_ORDER: Record<TaskStatus, number> = {
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
  let result = [...tasks]

  if (filter !== 'all') {
    result = result.filter((t) => t.status === filter)
  }

  if (typeFilter !== 'all') {
    result = result.filter((t) => t.type === (typeFilter as GenType))
  }

  const q = search.trim().toLowerCase()
  if (q) {
    result = result.filter((t) => t.prompt.toLowerCase().includes(q))
  }

  switch (sort) {
    case 'newest':
      result.sort((a, b) => b.createdAt - a.createdAt)
      break
    case 'oldest':
      result.sort((a, b) => a.createdAt - b.createdAt)
      break
    case 'status':
      result.sort(
        (a, b) =>
          STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status] ||
          b.createdAt - a.createdAt,
      )
      break
    case 'progress':
      result.sort((a, b) => b.progress - a.progress || b.createdAt - a.createdAt)
      break
  }

  return result
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
  const queued = tasks.filter((t) => t.status === 'queued').sort((a, b) => a.createdAt - b.createdAt)
  return [...running, ...queued].slice(0, limit)
}
