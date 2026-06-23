import type { GenerationTask } from '@/entities/generation-task'
import { cn } from '@/shared/lib/utils'
import { formatCredits, formatDuration, formatEta, formatQueuePosition } from '../lib/formatEta'
import { ProgressBar } from './ProgressBar'
import { QueueStatusBadge } from './QueueStatusBadge'
import { TaskActions } from './TaskActions'
import { TaskTypeIcon } from './TaskTypeIcon'

interface TaskCardProps {
  task: GenerationTask
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskCard({ task, onCancel, onRetry, onRemove }: TaskCardProps) {
  const isRunning = task.status === 'running'

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 rounded-[var(--r-md)]',
        'bg-[var(--bg-card)] border border-[var(--border-primary)]',
      )}
    >
      {/* Top row: icon + prompt + menu */}
      <div className="flex items-start gap-3">
        <TaskTypeIcon type={task.type} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {task.prompt}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--bg-pill)] border border-[var(--border-secondary)] text-[var(--text-secondary)] leading-none">
              <span className="w-1 h-1 rounded-full bg-[#E85420] shrink-0" />
              {task.model}
            </span>
            {isRunning && task.startedAt && (
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                {formatEta((100 - task.progress) * 300)} · {formatCredits(task.credits)}
              </span>
            )}
            {task.status === 'queued' && task.queuePosition && (
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                {formatQueuePosition(task.queuePosition)}
              </span>
            )}
            {task.status === 'done' && task.startedAt && task.completedAt && (
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                {formatDuration(task.startedAt, task.completedAt)} · {formatCredits(task.credits)}
              </span>
            )}
          </div>
        </div>
        <TaskActions
          task={task}
          onCancel={onCancel}
          onRetry={onRetry}
          onRemove={onRemove}
          className="-mt-1 -mr-1"
        />
      </div>

      {/* Progress bar */}
      {isRunning && <ProgressBar progress={task.progress} className="mt-1" />}

      {/* Error text */}
      {task.status === 'failed' && task.error && (
        <p className="text-xs text-[#ef4444]">{task.error}</p>
      )}

      {/* Bottom row: badge + % */}
      <div className="flex items-center justify-between mt-1">
        <QueueStatusBadge status={task.status} />
        {isRunning && (
          <span className="text-sm font-mono font-bold text-[#E85420] tabular-nums">
            {task.progress}%
          </span>
        )}
      </div>
    </div>
  )
}
