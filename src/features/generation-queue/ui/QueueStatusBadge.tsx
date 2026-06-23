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

const STATUS_STYLES: Record<TaskStatus, string> = {
  queued: 'bg-[var(--bg-tag)] text-[var(--text-secondary)] border-[var(--border-secondary)]',
  running: 'bg-[rgba(232,84,32,0.15)] text-[#E85420] border-[rgba(232,84,32,0.3)]',
  done: 'bg-[rgba(34,197,94,0.12)] text-[#22c55e] border-[rgba(34,197,94,0.25)]',
  failed: 'bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[rgba(239,68,68,0.25)]',
  canceled: 'bg-[var(--bg-tag)] text-[var(--text-tertiary)] border-[var(--border-secondary)]',
}

export function QueueStatusBadge({ status, className }: QueueStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium leading-none whitespace-nowrap',
        STATUS_STYLES[status],
        className,
      )}
    >
      {status === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#E85420] animate-pulse shrink-0" />
      )}
      {STATUS_LABELS[status]}
    </span>
  )
}
