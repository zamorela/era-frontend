import { useCallback } from 'react'
import { toast } from 'sonner'
import { useQueueContext } from './QueueProvider'

export function useQueue() {
  const ctx = useQueueContext()
  const { state, dispatch } = ctx

  const cancel = useCallback(
    (id: string) => dispatch({ type: 'CANCEL_TASK', id }),
    [dispatch],
  )

  const retry = useCallback(
    (id: string) => dispatch({ type: 'RETRY_TASK', id }),
    [dispatch],
  )

  const remove = useCallback(
    (id: string) => dispatch({ type: 'DELETE_TASK', id }),
    [dispatch],
  )

  const retryInit = useCallback(() => {
    // Reset state to loading — trigger a new INIT attempt
    // We re-dispatch INIT_ERROR → loading is already set; to retry, force a page-level re-mount
    // Simplest approach: call window.location.reload is too heavy.
    // Instead: re-init by setting to loading via a fresh INIT
    const stored = (() => {
      try {
        const raw = localStorage.getItem('era2_queue')
        if (!raw) return null
        return JSON.parse(raw)
      } catch {
        return null
      }
    })()
    import('@/entities/generation-task').then(({ SEED_TASKS }) => {
      dispatch({ type: 'INIT', tasks: stored ?? SEED_TASKS })
    })
  }, [dispatch])

  const clearDone = useCallback(() => {
    const snapshot = state.tasks.filter((t) => t.status === 'done')
    if (snapshot.length === 0) return
    dispatch({ type: 'CLEAR_DONE' })
    toast('Готовые задачи удалены', {
      duration: 5000,
      action: {
        label: 'Отменить',
        onClick: () => dispatch({ type: 'UNDO_CLEAR_DONE', snapshot }),
      },
    })
  }, [dispatch, state.tasks])

  return {
    tasks: ctx.filteredTasks,
    allTasks: state.tasks,
    stats: ctx.stats,
    initStatus: state.initStatus,
    filter: ctx.filter,
    setFilter: ctx.setFilter,
    sort: ctx.sort,
    setSort: ctx.setSort,
    search: ctx.search,
    setSearch: ctx.setSearch,
    typeFilter: ctx.typeFilter,
    setTypeFilter: ctx.setTypeFilter,
    activeCount: ctx.activeCount,
    avgProgress: ctx.avgProgress,
    topActive: ctx.topActive,
    cancel,
    retry,
    remove,
    clearDone,
    retryInit,
  }
}
