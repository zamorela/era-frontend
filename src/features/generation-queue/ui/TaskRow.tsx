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

function MetaLine({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-[var(--text-tertiary)] font-mono leading-none">{children}</span>
  )
}

export function TaskRow({ task, onCancel, onRetry, onRemove }: TaskRowProps) {
  const isRunning = task.status === 'running'

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3.5 rounded-[14px]',
        'bg-[var(--bg-card)] border border-[var(--border-primary)]',
        'hover:bg-[var(--bg-card-hover)] transition-colors duration-150',
      )}
    >
      <TaskTypeIcon type={task.type} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-foreground truncate leading-snug">{task.prompt}</p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap min-h-[18px]">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E85420] shrink-0" />
            {task.model}
          </span>

          {isRunning && task.startedAt && (
            <MetaLine>{`${formatEta((100 - task.progress) * 300)} · ${formatCredits(task.credits)}`}</MetaLine>
          )}

          {task.status === 'queued' && (
            <MetaLine>
              {task.queuePosition
                ? `${formatQueuePosition(task.queuePosition)} · ${formatCredits(task.credits)}`
                : formatCredits(task.credits)}
            </MetaLine>
          )}

          {task.status === 'done' && task.startedAt && task.completedAt && (
            <MetaLine>{`${formatDuration(task.startedAt, task.completedAt)} · ${formatCredits(task.credits)}`}</MetaLine>
          )}

          {task.status === 'failed' && task.error && (
            <span className="text-xs font-mono text-[#ef4444]">{task.error}</span>
          )}

          {task.status === 'canceled' && (
            <MetaLine>отменено пользователем</MetaLine>
          )}
        </div>

        {isRunning && <ProgressBar progress={task.progress} className="mt-2.5" />}
      </div>

      <div className="flex flex-col items-end justify-center shrink-0 min-w-[56px]">
        {isRunning ? (
          <>
            <span className="text-lg font-bold font-mono text-[#E85420] tabular-nums leading-none">
              {task.progress}%
            </span>
            <span className="text-xs font-medium text-[#E85420] mt-1">Идёт</span>
          </>
        ) : (
          <QueueStatusBadge status={task.status} />
        )}
      </div>

      <TaskActions task={task} onCancel={onCancel} onRetry={onRetry} onRemove={onRemove} />
    </div>
  )
}
