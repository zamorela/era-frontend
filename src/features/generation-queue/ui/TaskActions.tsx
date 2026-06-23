import { Download, MoreHorizontal, RotateCcw, Trash2, X } from 'lucide-react'
import type { GenerationTask } from '@/entities/generation-task'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'

interface TaskActionsProps {
  task: GenerationTask
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  className?: string
}

function ActionButton({
  onClick,
  label,
  children,
  className,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-[10px]',
        'border border-[var(--border-primary)] bg-[var(--bg-secondary)]',
        'text-[var(--text-secondary)] hover:text-foreground hover:bg-[var(--bg-tag)]',
        'transition-colors duration-150',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TaskActions({ task, onCancel, onRetry, onRemove, className }: TaskActionsProps) {
  return (
    <div className={cn('flex items-center gap-1.5 shrink-0', className)}>
      {(task.status === 'running' || task.status === 'queued') && (
        <ActionButton onClick={() => onCancel(task.id)} label="Отменить задачу">
          <X size={14} />
        </ActionButton>
      )}

      {(task.status === 'failed' || task.status === 'canceled') && (
        <ActionButton
          onClick={() => onRetry(task.id)}
          label="Повторить задачу"
          className="hover:text-[#E85420]"
        >
          <RotateCcw size={14} />
        </ActionButton>
      )}

      {task.status === 'done' && (
        <ActionButton onClick={() => {}} label="Скачать результат">
          <Download size={14} />
        </ActionButton>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Дополнительные действия"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-[10px]',
              'border border-[var(--border-primary)] bg-[var(--bg-secondary)]',
              'text-[var(--text-secondary)] hover:text-foreground hover:bg-[var(--bg-tag)]',
              'transition-colors duration-150',
            )}
          >
            <MoreHorizontal size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive gap-2"
            onClick={() => onRemove(task.id)}
          >
            <Trash2 size={14} />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
