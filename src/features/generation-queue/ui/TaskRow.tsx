import type { GenerationTask } from '@/entities/generation-task'
import { cn } from '@/shared/lib/utils'
import { formatCredits, formatDuration, formatEta, formatQueuePosition } from '../lib/formatEta'
import { ProgressBar } from './ProgressBar'
import { QueueStatusBadge } from './QueueStatusBadge'
import { TaskActions } from './TaskActions'
import { TaskTypeIcon } from './TaskTypeIcon'

interface TaskRowProps {
  task: GenerationTask
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
}

function MetaText({ children }: { children: string }) {
  return <span className="text-xs text-[var(--text-tertiary)] font-mono">{children}</span>
}

export function TaskRow({ task, onCancel, onRetry, onRemove }: TaskRowProps) {
  const isRunning = task.status === 'running'

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[var(--r-md)]',
        'bg-[var(--bg-card)] border border-[var(--border-primary)]',
        'hover:bg-[var(--bg-card-hover)] transition-colors duration-150',
        'group',
      )}
    >
      {/* Icon */}
      <TaskTypeIcon type={task.type} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-snug">{task.prompt}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-pill)] border border-[var(--border-secondary)] text-[var(--text-secondary)] leading-none">
            <span className="w-1 h-1 rounded-full bg-[#E85420] shrink-0" />
            {task.model}
          </span>
          {isRunning && task.startedAt && (
            <MetaText>{`${formatEta((100 - task.progress) * 300)} · ${formatCredits(task.credits)}`}</MetaText>
          )}
          {task.status === 'queued' && task.queuePosition && (
            <MetaText>{`${formatQueuePosition(task.queuePosition)} · ${formatCredits(task.credits)}`}</MetaText>
          )}
          {task.status === 'done' && task.startedAt && task.completedAt && (
            <MetaText>{`${formatDuration(task.startedAt, task.completedAt)} · ${formatCredits(task.credits)}`}</MetaText>
          )}
          {task.status === 'failed' && task.error && (
            <span className="text-xs text-[#ef4444]">{task.error}</span>
          )}
          {task.status === 'canceled' && (
            <MetaText>{'отменено пользователем'}</MetaText>
          )}
        </div>
        {isRunning && (
          <ProgressBar progress={task.progress} className="mt-2" />
        )}
      </div>

      {/* Progress % + badge */}
      <div className="flex items-center gap-3 shrink-0">
        {isRunning && (
          <span className="text-sm font-mono font-bold text-[#E85420] tabular-nums w-10 text-right">
            {task.progress}%
          </span>
        )}
        <QueueStatusBadge status={task.status} />
      </div>

      {/* Actions */}
      <TaskActions
        task={task}
        onCancel={onCancel}
        onRetry={onRetry}
        onRemove={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      />
    </div>
  )
}
