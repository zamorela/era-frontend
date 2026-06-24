import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import type { GenerationTask } from '@/entities/generation-task'
import { SEED_TASKS } from '@/entities/generation-task'
import { loadQueueFromStorage, saveQueueToStorage } from '../lib/queueStorage'
import { startEngine } from './queueEngine'
import type { QueueEngine } from './queueEngine'
import { queueReducer, initialQueueState } from './queueReducer'
import type { QueueAction, QueueState, StatusFilter, SortOrder, TypeFilter } from './queueReducer'
import {
  selectStats,
  selectFiltered,
  selectActiveCount,
  selectAvgProgress,
  selectTopActive,
  selectTasksWithPositions,
} from './selectors'
import type { QueueStats } from './selectors'

const INIT_DELAY_MS = 600
const INIT_ERROR_PROBABILITY = 0.05

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
  topActive: ReturnType<typeof selectTopActive>
}

const QueueContext = createContext<QueueContextValue | null>(null)

export function useQueueContext(): QueueContextValue {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueueContext must be used inside QueueProvider')
  return ctx
}

function reducerWithRef(
  stateRef: MutableRefObject<QueueState>,
  state: QueueState,
  action: QueueAction,
): QueueState {
  const next = queueReducer(state, action)
  stateRef.current = next
  return next
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const stateRef = useRef(initialQueueState)
  const engineRef = useRef<QueueEngine | null>(null)
  const [initKey, setInitKey] = useState(0)

  const [state, dispatch] = useReducer(
    (s, a) => reducerWithRef(stateRef, s, a),
    initialQueueState,
    (initial) => {
      stateRef.current = initial
      return initial
    },
  )

  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const dispatchWithCancel = useCallback((action: QueueAction) => {
    if (action.type === 'CANCEL_TASK') {
      engineRef.current?.cancelTask(action.id)
    }
    dispatch(action)
  }, [])

  const retryInit = useCallback(() => setInitKey((k) => k + 1), [])

  useEffect(() => {
    if (state.initStatus !== 'ready') return
    saveQueueToStorage(state.tasks)
  }, [state.tasks, state.initStatus])

  useEffect(() => {
    dispatch({ type: 'RESET_INIT' })

    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return

      if (import.meta.env.DEV && Math.random() < INIT_ERROR_PROBABILITY) {
        dispatch({ type: 'INIT_ERROR' })
        return
      }

      const stored = loadQueueFromStorage()
      dispatch({ type: 'INIT', tasks: stored ?? SEED_TASKS })
    }, INIT_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [initKey])

  useEffect(() => {
    if (state.initStatus !== 'ready') return

    const engine = startEngine(dispatchWithCancel, stateRef)
    engineRef.current = engine

    return () => {
      engine.cleanup()
      engineRef.current = null
    }
  }, [state.initStatus, dispatchWithCancel])

  const tasksWithPositions = useMemo(
    () => selectTasksWithPositions(state.tasks),
    [state.tasks],
  )

  const stats = useMemo(() => selectStats(tasksWithPositions), [tasksWithPositions])
  const filteredTasks = useMemo(
    () => selectFiltered(tasksWithPositions, filter, sort, search, typeFilter),
    [tasksWithPositions, filter, sort, search, typeFilter],
  )
  const activeCount = useMemo(
    () => selectActiveCount(tasksWithPositions),
    [tasksWithPositions],
  )
  const avgProgress = useMemo(
    () => selectAvgProgress(tasksWithPositions),
    [tasksWithPositions],
  )
  const topActive = useMemo(
    () => selectTopActive(tasksWithPositions),
    [tasksWithPositions],
  )

  const contextValue = useMemo<QueueContextValue>(
    () => ({
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
    }),
    [
      state,
      dispatchWithCancel,
      retryInit,
      stats,
      filter,
      sort,
      search,
      typeFilter,
      filteredTasks,
      activeCount,
      avgProgress,
      topActive,
    ],
  )

  return <QueueContext.Provider value={contextValue}>{children}</QueueContext.Provider>
}
