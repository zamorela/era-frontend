export type GenType = 'text' | 'image' | 'video' | 'audio'

export type TaskStatus = 'queued' | 'running' | 'done' | 'failed' | 'canceled'

export interface GenerationTask {
  id: string
  prompt: string
  type: GenType
  model: string
  status: TaskStatus
  progress: number
  createdAt: number
  startedAt?: number
  completedAt?: number
  error?: string
  credits: number
  queuePosition?: number
  /** Внутреннее поле движка: прогресс, на котором задача упадёт в failed. Не сохраняется в localStorage. */
  _failAtProgress?: number
}
