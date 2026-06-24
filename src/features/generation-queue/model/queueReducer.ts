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
  | { type: 'RESET_INIT' }
  | { type: 'ADD_TASK'; task: GenerationTask }
  | { type: 'START_TASK'; id: string; failAtProgress?: number }
  | { type: 'TICK_PROGRESS'; id: string; delta: number }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'FAIL_TASK'; id: string; error: string }
  | { type: 'CANCEL_TASK'; id: string }
  | { type: 'RETRY_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'CLEAR_DONE' }
  | { type: 'RESTORE_TASKS'; tasks: GenerationTask[] }
  | { type: 'UNDO_CLEAR_DONE'; snapshot: GenerationTask[] }
  | { type: 'REORDER_QUEUED'; activeId: string; overId: string }

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'RESET_INIT':
      return { ...state, initStatus: 'loading' }

    case 'INIT':
      // accept only from 'loading' — RESET_INIT must be dispatched first for retries
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

    case 'UNDO_CLEAR_DONE':
      return queueReducer(state, { type: 'RESTORE_TASKS', tasks: action.snapshot })

    case 'RESTORE_TASKS': {
      const existingIds = new Set(state.tasks.map((t) => t.id))
      const toRestore = action.tasks.filter((t) => !existingIds.has(t.id))
      if (toRestore.length === 0) return state
      return {
        ...state,
        tasks: [...state.tasks, ...toRestore].sort((a, b) => a.createdAt - b.createdAt),
        undoSnapshot: null,
      }
    }

    case 'REORDER_QUEUED': {
      const { activeId, overId } = action
      if (activeId === overId) return state

      const queued = state.tasks
        .filter((t) => t.status === 'queued')
        .sort((a, b) => a.createdAt - b.createdAt)

      const fromIdx = queued.findIndex((t) => t.id === activeId)
      const toIdx = queued.findIndex((t) => t.id === overId)
      if (fromIdx === -1 || toIdx === -1 || queued.length === 0) return state

      const reordered = [...queued]
      const [moved] = reordered.splice(fromIdx, 1)
      reordered.splice(toIdx, 0, moved)

      const baseTime = Math.min(...queued.map((t) => t.createdAt))
      const updated = new Map(
        reordered.map((t, i) => [t.id, { ...t, createdAt: baseTime + i * 1000 }]),
      )

      return {
        ...state,
        tasks: state.tasks.map((t) => updated.get(t.id) ?? t),
      }
    }

    case 'ADD_TASK':
      return { ...state, tasks: [action.task, ...state.tasks] }

    default:
      return state
  }
}
