import type { GenerationTask } from '@/entities/generation-task'

export type StatusFilter = 'all' | 'queued' | 'running' | 'done' | 'failed'
export type SortOrder = 'newest' | 'oldest' | 'status' | 'progress'
export type TypeFilter = 'all' | 'text' | 'image' | 'video' | 'audio'

export interface QueueState {
  tasks: GenerationTask[]
  initStatus: 'loading' | 'ready' | 'error'
  undoSnapshot: GenerationTask[] | null
}

export const initialQueueState: QueueState = {
  tasks: [],
  initStatus: 'loading',
  undoSnapshot: null,
}

export type QueueAction =
  | { type: 'INIT'; tasks: GenerationTask[] }
  | { type: 'INIT_ERROR' }
  | { type: 'START_TASK'; id: string; failAtProgress?: number }
  | { type: 'TICK_PROGRESS'; id: string; delta: number }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'FAIL_TASK'; id: string; error: string }
  | { type: 'CANCEL_TASK'; id: string }
  | { type: 'RETRY_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'CLEAR_DONE' }
  | { type: 'UNDO_CLEAR_DONE'; snapshot: GenerationTask[] }

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'INIT':
      if (state.initStatus !== 'loading') return state
      return { ...state, tasks: action.tasks, initStatus: 'ready' }

    case 'INIT_ERROR':
      if (state.initStatus !== 'loading') return state
      return { ...state, initStatus: 'error' }

    case 'START_TASK': {
      const now = Date.now()
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id && t.status === 'queued'
            ? {
                ...t,
                status: 'running',
                startedAt: now,
                queuePosition: undefined,
                _failAtProgress: action.failAtProgress,
              }
            : t,
        ),
      }
    }

    case 'TICK_PROGRESS': {
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.id || t.status !== 'running') return t
          const newProgress = Math.min(100, t.progress + action.delta)
          return { ...t, progress: newProgress }
        }),
      }
    }

    case 'COMPLETE_TASK': {
      const now = Date.now()
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id && t.status === 'running'
            ? { ...t, status: 'done', progress: 100, completedAt: now, _failAtProgress: undefined }
            : t,
        ),
      }
    }

    case 'FAIL_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id && t.status === 'running'
            ? { ...t, status: 'failed', error: action.error, _failAtProgress: undefined }
            : t,
        ),
      }
    }

    case 'CANCEL_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id && (t.status === 'running' || t.status === 'queued')
            ? { ...t, status: 'canceled', _failAtProgress: undefined }
            : t,
        ),
      }
    }

    case 'RETRY_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id && (t.status === 'failed' || t.status === 'canceled')
            ? {
                ...t,
                status: 'queued',
                progress: 0,
                error: undefined,
                startedAt: undefined,
                completedAt: undefined,
                _failAtProgress: undefined,
              }
            : t,
        ),
      }
    }

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }

    case 'CLEAR_DONE': {
      const doneTasks = state.tasks.filter((t) => t.status === 'done')
      if (doneTasks.length === 0) return state
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.status !== 'done'),
        undoSnapshot: doneTasks,
      }
    }

    case 'UNDO_CLEAR_DONE': {
      return {
        ...state,
        tasks: [...state.tasks, ...action.snapshot].sort((a, b) => a.createdAt - b.createdAt),
        undoSnapshot: null,
      }
    }

    default:
      return state
  }
}
