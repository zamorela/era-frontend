import type { GenerationTask } from '@/entities/generation-task'
import { generationTaskListSchema } from '@/entities/generation-task/model/schema'

export const QUEUE_STORAGE_KEY = 'era2_queue'

export function normalizeTasksForRestore(tasks: GenerationTask[]): GenerationTask[] {
  return tasks.map((task) => ({
    ...task,
    _failAtProgress: undefined,
    status: task.status === 'running' ? 'queued' : task.status,
  }))
}

export function stripEngineFields(tasks: GenerationTask[]): GenerationTask[] {
  return tasks.map(({ _failAtProgress: _, ...rest }) => rest)
}

export function loadQueueFromStorage(): GenerationTask[] | null {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!raw) return null

    const parsed = generationTaskListSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      localStorage.removeItem(QUEUE_STORAGE_KEY)
      return null
    }

    return normalizeTasksForRestore(parsed.data)
  } catch {
    return null
  }
}

export function saveQueueToStorage(tasks: GenerationTask[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(stripEngineFields(tasks)))
  } catch {
    // QuotaExceededError and private mode — non-fatal for mock queue.
  }
}
