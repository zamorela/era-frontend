import type { GenerationTask } from '@/entities/generation-task'
import { estimateRemainingMs } from '../lib/tickConfig'
import { formatCredits, formatDuration, formatEta, formatQueuePosition } from '../lib/formatEta'

interface TaskMetaProps {
  task: GenerationTask
  className?: string
}

function MetaLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={className ?? 'text-xs text-[var(--text-tertiary)] font-mono leading-none'}>
      {children}
    </span>
  )
}

export function TaskMeta({ task, className }: TaskMetaProps) {
  const metaClass = className ?? 'text-xs text-[var(--text-tertiary)] font-mono leading-none'

  if (task.status === 'running') {
    return (
      <MetaLine className={metaClass}>
        {`${formatEta(estimateRemainingMs(task.type, task.progress))} · ${formatCredits(task.credits)}`}
      </MetaLine>
    )
  }

  if (task.status === 'queued') {
    return (
      <MetaLine className={metaClass}>
        {task.queuePosition
          ? `${formatQueuePosition(task.queuePosition)} · ${formatCredits(task.credits)}`
          : formatCredits(task.credits)}
      </MetaLine>
    )
  }

  if (task.status === 'done' && task.startedAt && task.completedAt) {
    return (
      <MetaLine className={metaClass}>
        {`${formatDuration(task.startedAt, task.completedAt)} · ${formatCredits(task.credits)}`}
      </MetaLine>
    )
  }

  if (task.status === 'failed' && task.error) {
    return <span className="text-xs font-mono text-[#ef4444]">{task.error}</span>
  }

  if (task.status === 'canceled') {
    return <MetaLine className={metaClass}>отменено пользователем</MetaLine>
  }

  return null
}
