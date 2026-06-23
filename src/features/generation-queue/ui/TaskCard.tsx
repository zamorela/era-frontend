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
        'flex flex-col gap-3 p-3.5 sm:p-4 rounded-[14px]',
        'bg-[var(--bg-card)] border border-[var(--border-primary)]',
      )}
    >
      <div className="flex items-start gap-3">
        <TaskTypeIcon type={task.type} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] sm:text-[15px] font-medium text-foreground line-clamp-2 leading-snug">
            {task.prompt}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E85420] shrink-0" />
              {task.model}
            </span>
            {isRunning && task.startedAt && (
              <span className="text-[11px] sm:text-xs font-mono text-[var(--text-tertiary)]">
                {`${formatEta((100 - task.progress) * 300)} · ${formatCredits(task.credits)}`}
              </span>
            )}
            {task.status === 'queued' && (
              <span className="text-[11px] sm:text-xs font-mono text-[var(--text-tertiary)]">
                {task.queuePosition
                  ? `${formatQueuePosition(task.queuePosition)} · ${formatCredits(task.credits)}`
                  : formatCredits(task.credits)}
              </span>
            )}
            {task.status === 'done' && task.startedAt && task.completedAt && (
              <span className="text-[11px] sm:text-xs font-mono text-[var(--text-tertiary)]">
                {`${formatDuration(task.startedAt, task.completedAt)} · ${formatCredits(task.credits)}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {isRunning && <ProgressBar progress={task.progress} />}

      {task.status === 'failed' && task.error && (
        <p className="text-[11px] sm:text-xs font-mono text-[#ef4444] -mt-1">{task.error}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {isRunning ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium leading-none bg-[rgba(232,84,32,0.12)] text-[#E85420] border border-[rgba(232,84,32,0.25)]">
              Идёт
            </span>
            <span className="text-[15px] sm:text-base font-bold font-mono text-[#E85420] tabular-nums leading-none">
              {task.progress}%
            </span>
          </div>
        ) : (
          <QueueStatusBadge status={task.status} />
        )}

        <TaskActions
          task={task}
          onCancel={onCancel}
          onRetry={onRetry}
          onRemove={onRemove}
        />
      </div>
    </div>
  )
}
