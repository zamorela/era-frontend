import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { Button } from '@/shared/ui/button'
import { useQueue } from '@/features/generation-queue'
import { QueueStats } from '@/features/generation-queue/ui/QueueStats'
import { QueueToolbar } from '@/features/generation-queue/ui/QueueToolbar'
import { TaskRow } from '@/features/generation-queue/ui/TaskRow'
import { TaskCard } from '@/features/generation-queue/ui/TaskCard'
import { LoadingState } from '@/features/generation-queue/ui/states/LoadingState'
import { EmptyState } from '@/features/generation-queue/ui/states/EmptyState'
import { ErrorState } from '@/features/generation-queue/ui/states/ErrorState'

export function GenerationQueue() {
  const isMobile = useIsMobile()
  const {
    tasks,
    stats,
    initStatus,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    cancel,
    retry,
    remove,
    clearDone,
    retryInit,
  } = useQueue()

  useEffect(() => {
    document.title = 'ERA2 — Очередь генераций'
    return () => {
      document.title = 'ERA2'
    }
  }, [])

  const hasFilters = filter !== 'all' || typeFilter !== 'all' || search.trim() !== ''

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              Очередь генераций
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Все ваши задачи в реальном времени
            </p>
          </div>
          {stats.done > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1.5 text-[var(--text-secondary)]"
              onClick={clearDone}
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Очистить готовые</span>
              <span className="sm:hidden">Очистить</span>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6">
          <QueueStats stats={stats} />
        </div>

        {/* Toolbar */}
        <div className="mb-4">
          <QueueToolbar
            filter={filter}
            onFilterChange={setFilter}
            sort={sort}
            onSortChange={setSort}
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />
        </div>

        {/* Content */}
        {initStatus === 'loading' && <LoadingState />}

        {initStatus === 'error' && <ErrorState onRetry={retryInit} />}

        {initStatus === 'ready' && tasks.length === 0 && (
          <EmptyState hasFilters={hasFilters} />
        )}

        {initStatus === 'ready' && tasks.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {isMobile ? (
                    <TaskCard
                      task={task}
                      onCancel={cancel}
                      onRetry={retry}
                      onRemove={remove}
                    />
                  ) : (
                    <TaskRow
                      task={task}
                      onCancel={cancel}
                      onRetry={retry}
                      onRemove={remove}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
