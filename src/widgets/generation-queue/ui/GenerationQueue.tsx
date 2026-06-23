import { Plus } from 'lucide-react'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { Button } from '@/shared/ui/button'
import {
  useQueue,
  QueueStats,
  QueueToolbar,
  TaskList,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/features/generation-queue'

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
    reorderQueued,
    clearDone,
    retryInit,
    addTestTask,
  } = useQueue()

  const hasFilters = filter !== 'all' || typeFilter !== 'all' || search.trim() !== ''

  return (
    <div className="min-h-[calc(100vh-var(--header-height,64px))] bg-background">
      <div className="max-w-[1120px] mx-auto px-4 pt-5 pb-8 sm:pt-8 sm:pb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-5 sm:mb-8">
          <div>
            <h1 className="text-[24px] sm:text-[32px] font-bold text-foreground leading-none tracking-[-0.02em]">
              Очередь генераций
            </h1>
            <p className="text-[13px] sm:text-sm text-[var(--text-tertiary)] mt-1.5 sm:mt-2">
              Все ваши задачи в реальном времени
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start">
            {import.meta.env.DEV && (
              <Button
                variant="outline"
                size="sm"
                onClick={addTestTask}
                className="h-9 px-4 rounded-full text-[13px] font-medium border-dashed border-[var(--border-primary)] bg-transparent text-[var(--text-secondary)] hover:text-foreground hover:bg-[var(--bg-tag)] gap-1.5"
              >
                <Plus size={14} />
                Тест
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={stats.done === 0}
              onClick={clearDone}
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full text-[12px] sm:text-[13px] font-medium border-[var(--border-primary)] bg-transparent text-[var(--text-secondary)] hover:text-foreground hover:bg-[var(--bg-tag)]"
            >
              Очистить готовые
            </Button>
          </div>
        </div>

        <div className="mb-5">
          <QueueStats stats={stats} />
        </div>

        <div className="mb-5">
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

        {initStatus === 'loading' && <LoadingState />}

        {initStatus === 'error' && <ErrorState onRetry={retryInit} />}

        {initStatus === 'ready' && tasks.length === 0 && (
          <EmptyState hasFilters={hasFilters} />
        )}

        {initStatus === 'ready' && tasks.length > 0 && (
          <TaskList
            tasks={tasks}
            isMobile={isMobile}
            onCancel={cancel}
            onRetry={retry}
            onRemove={remove}
            onReorderQueued={reorderQueued}
          />
        )}
      </div>
    </div>
  )
}
