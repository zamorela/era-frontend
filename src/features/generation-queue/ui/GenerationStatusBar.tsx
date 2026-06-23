import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Loader2, X } from 'lucide-react'
import { useNavigate } from '@/shared/routing'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { useQueue } from '../model/useQueue'
import { ProgressBar } from './ProgressBar'
import { TaskTypeIcon } from './TaskTypeIcon'

export function GenerationStatusBar() {
  const { activeCount, avgProgress, topActive } = useQueue()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const goToQueue = () => navigate('/queue')

  return (
    <AnimatePresence>
      {activeCount > 0 && (
        <motion.div
          key="status-bar"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn(
            'fixed z-50',
            'md:bottom-6 md:right-6 md:w-80',
            'max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:pb-[env(safe-area-inset-bottom)]',
          )}
        >
          {/* Collapsed pill (bonus) */}
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer w-full md:w-auto',
                'bg-[var(--bg-popup)] border border-[var(--border-primary)]',
                'shadow-[var(--shadow-2)]',
                'hover:border-[#E85420] transition-colors duration-150',
                'md:ml-auto',
              )}
            >
              <Loader2 size={14} className="text-[#E85420] animate-spin shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {activeCount} {activeCount === 1 ? 'генерация' : 'генерации'} · {avgProgress}%
              </span>
              <ChevronUp size={14} className="text-[var(--text-tertiary)] ml-auto" />
            </button>
          ) : activeCount === 1 ? (
            /* Single task — compact card */
            <SingleTaskBar
              task={topActive[0]}
              onCollapse={() => setIsCollapsed(true)}
              onNavigate={goToQueue}
            />
          ) : (
            /* Multiple tasks — expanded widget */
            <MultiTaskBar
              activeCount={activeCount}
              avgProgress={avgProgress}
              tasks={topActive}
              onCollapse={() => setIsCollapsed(true)}
              onNavigate={goToQueue}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Single task compact card ─────────────────────────────────── */
interface SingleTaskBarProps {
  task: ReturnType<typeof useQueue>['topActive'][number]
  onCollapse: () => void
  onNavigate: () => void
}

function SingleTaskBar({ task, onCollapse, onNavigate }: SingleTaskBarProps) {
  if (!task) return null
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 rounded-[var(--r-md)] cursor-pointer',
        'bg-[var(--bg-popup)] border border-[var(--border-primary)]',
        'shadow-[var(--shadow-2)]',
        'hover:border-[rgba(232,84,32,0.4)] transition-colors duration-150',
      )}
      onClick={onNavigate}
    >
      <div className="flex items-center gap-3">
        <Loader2 size={16} className="text-[#E85420] animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-tertiary)] mb-0.5">
            {task.status === 'running' ? 'Генерация идёт' : 'Ожидание'}
          </p>
          <p className="text-sm font-medium text-foreground truncate">{task.prompt}</p>
        </div>
        <Button
          variant="quiet"
          size="icon"
          className="w-6 h-6 shrink-0 -mr-1"
          onClick={(e) => { e.stopPropagation(); onCollapse() }}
          aria-label="Свернуть"
        >
          <ChevronDown size={12} />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-[var(--bg-pill)] border border-[var(--border-secondary)] text-[var(--text-secondary)]">
          {task.model}
        </span>
        <div className="flex-1">
          <ProgressBar progress={task.progress} showLabel />
        </div>
      </div>
    </div>
  )
}

/* ── Multiple tasks expanded widget ──────────────────────────── */
interface MultiTaskBarProps {
  activeCount: number
  avgProgress: number
  tasks: ReturnType<typeof useQueue>['topActive']
  onCollapse: () => void
  onNavigate: () => void
}

function MultiTaskBar({ activeCount, avgProgress, tasks, onCollapse, onNavigate }: MultiTaskBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0 rounded-[var(--r-md)] overflow-hidden',
        'bg-[var(--bg-popup)] border border-[var(--border-primary)]',
        'shadow-[var(--shadow-2)]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
        <Loader2 size={14} className="text-[#E85420] animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">Генерации идут</span>
          <span className="text-xs text-[var(--text-tertiary)] ml-2">
            {activeCount} {activeCount <= 4 ? ['', 'активна', 'активны', 'активны', 'активны'][Math.min(activeCount, 4)] : 'активны'} · {avgProgress}%
          </span>
        </div>
        <Button
          variant="quiet"
          size="icon"
          className="w-6 h-6 shrink-0 -mr-1"
          onClick={onCollapse}
          aria-label="Свернуть"
        >
          <ChevronDown size={12} />
        </Button>
      </div>

      {/* Task mini-list */}
      <div className="flex flex-col divide-y divide-[var(--border-primary)]">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            onClick={onNavigate}
          >
            <TaskTypeIcon type={task.type} size="sm" />
            <p className="flex-1 text-sm text-foreground truncate min-w-0">{task.prompt}</p>
            {task.status === 'running' ? (
              <span className="text-xs font-mono text-[#E85420] tabular-nums shrink-0">
                {task.progress}%
              </span>
            ) : (
              <span className="text-xs text-[var(--text-tertiary)] shrink-0">в очереди</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer link */}
      <button
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-[#E85420] font-medium hover:bg-[rgba(232,84,32,0.06)] transition-colors border-t border-[var(--border-primary)]"
        onClick={onNavigate}
      >
        Открыть очередь →
      </button>
    </div>
  )
}
