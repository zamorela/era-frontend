import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { GenerationTask } from '@/entities/generation-task'
import { SEED_TASKS } from '@/entities/generation-task'
import { queueReducer, initialQueueState } from './queueReducer'
import type { QueueAction, QueueState, StatusFilter, SortOrder, TypeFilter } from './queueReducer'
import { startEngine } from './queueEngine'
import type { QueueEngine } from './queueEngine'
import {
  selectStats,
  selectFiltered,
  selectActiveCount,
  selectAvgProgress,
  selectTopActive,
  selectTasksWithPositions,
} from './selectors'
import type { QueueStats } from './selectors'

const STORAGE_KEY = 'era2_queue'

function loadFromStorage(): GenerationTask[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const tasks = JSON.parse(raw) as GenerationTask[]
    return tasks.map((t) => ({
      ...t,
      _failAtProgress: undefined,
      status: t.status === 'running' ? 'queued' : t.status,
    }))
  } catch {
    return null
  }
}

function saveToStorage(tasks: GenerationTask[]) {
  try {
    const serializable = tasks.map(({ _failAtProgress: _, ...rest }) => rest)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch {
    // ignore quota errors
  }
}

interface QueueContextValue {
  state: QueueState
  dispatch: (action: QueueAction) => void
  retryInit: () => void
  stats: QueueStats
  filter: StatusFilter
  setFilter: (f: StatusFilter) => void
  sort: SortOrder
  setSort: (s: SortOrder) => void
  search: string
  setSearch: (s: string) => void
  typeFilter: TypeFilter
  setTypeFilter: (t: TypeFilter) => void
  filteredTasks: GenerationTask[]
  activeCount: number
  avgProgress: number
  topActive: GenerationTask[]
}

const QueueContext = createContext<QueueContextValue | null>(null)

export function useQueueContext(): QueueContextValue {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueueContext must be used inside QueueProvider')
  return ctx
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(queueReducer, initialQueueState)
  const stateRef = useRef(state)
  const engineRef = useRef<QueueEngine | null>(null)
  // Increment to trigger a re-init (used by retryInit)
  const [initKey, setInitKey] = useState(0)

  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Save to localStorage whenever tasks change
  useEffect(() => {
    if (state.initStatus !== 'ready') return
    saveToStorage(state.tasks)
  }, [state.tasks, state.initStatus])

  // Init / re-init: fires on mount and on retryInit
  useEffect(() => {
    dispatch({ type: 'RESET_INIT' })
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      // 5% chance of simulated init error
      if (Math.random() < 0.05) {
        dispatch({ type: 'INIT_ERROR' })
        return
      }
      const stored = loadFromStorage()
      dispatch({ type: 'INIT', tasks: stored ?? SEED_TASKS })
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [initKey]) // re-runs when retryInit is called

  // Start engine after init; clean up on unmount or re-init
  useEffect(() => {
    if (state.initStatus !== 'ready') return
    const engine = startEngine(dispatchWithCancel, stateRef)
    engineRef.current = engine
    return () => {
      engine.cleanup()
      engineRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.initStatus])

  const dispatchWithCancel = useCallback(
    (action: QueueAction) => {
      if (action.type === 'CANCEL_TASK') {
        engineRef.current?.cancelTask(action.id)
      }
      dispatch(action)
    },
    [],
  )

  const retryInit = useCallback(() => setInitKey((k) => k + 1), [])

  // Derived: assign live queue positions before filtering/sorting
  const tasksWithPositions = selectTasksWithPositions(state.tasks)
  const stats = selectStats(tasksWithPositions)
  const filteredTasks = selectFiltered(tasksWithPositions, filter, sort, search, typeFilter)
  const activeCount = selectActiveCount(tasksWithPositions)
  const avgProgress = selectAvgProgress(tasksWithPositions)
  const topActive = selectTopActive(tasksWithPositions)

  return (
    <QueueContext.Provider
      value={{
        state,
        dispatch: dispatchWithCancel,
        retryInit,
        stats,
        filter,
        setFilter,
        sort,
        setSort,
        search,
        setSearch,
        typeFilter,
        setTypeFilter,
        filteredTasks,
        activeCount,
        avgProgress,
        topActive,
      }}
    >
      {children}
    </QueueContext.Provider>
  )
}
