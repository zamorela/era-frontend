import type { TaskStatus } from '@/entities/generation-task'
import { cn } from '@/shared/lib/utils'

interface QueueStatusBadgeProps {
  status: TaskStatus
  className?: string
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  queued: 'В очереди',
  running: 'Идёт',
  done: 'Готово',
  failed: 'Ошибка',
  canceled: 'Отменено',
}

export function QueueStatusBadge({ status, className }: QueueStatusBadgeProps) {
  if (status === 'queued') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] sm:text-xs font-medium leading-none',
          'bg-[var(--bg-pill)] text-[var(--text-tertiary)] border-[var(--border-primary)]',
          className,
        )}
      >
        {STATUS_LABELS.queued}
      </span>
    )
  }

  if (status === 'done') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium leading-none',
          'bg-[rgba(34,197,94,0.1)] text-[#22c55e] border-[rgba(34,197,94,0.25)]',
          className,
        )}
      >
        {STATUS_LABELS.done}
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span className={cn('text-sm font-medium text-[#ef4444]', className)}>
        {STATUS_LABELS.failed}
      </span>
    )
  }

  if (status === 'running') {
    return (
      <span className={cn('text-sm font-medium text-[#E85420]', className)}>
        {STATUS_LABELS.running}
      </span>
    )
  }

  return (
    <span className={cn('text-sm font-medium text-[var(--text-tertiary)]', className)}>
      {STATUS_LABELS[status]}
    </span>
  )
}
