import { Download, MoreHorizontal, RotateCcw, Trash2, X } from 'lucide-react'
import type { GenerationTask } from '@/entities/generation-task'
import { Button } from '@/shared/ui/button'
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

export function TaskActions({ task, onCancel, onRetry, onRemove, className }: TaskActionsProps) {
  return (
    <div className={cn('flex items-center gap-1 shrink-0', className)}>
      {(task.status === 'running' || task.status === 'queued') && (
        <Button
          variant="quiet"
          size="icon"
          className="w-7 h-7 text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--bg-tag)]"
          onClick={() => onCancel(task.id)}
          aria-label="Отменить задачу"
        >
          <X size={14} />
        </Button>
      )}

      {(task.status === 'failed' || task.status === 'canceled') && (
        <Button
          variant="quiet"
          size="icon"
          className="w-7 h-7 text-[var(--text-tertiary)] hover:text-[#E85420] hover:bg-[rgba(232,84,32,0.08)]"
          onClick={() => onRetry(task.id)}
          aria-label="Повторить задачу"
        >
          <RotateCcw size={14} />
        </Button>
      )}

      {task.status === 'done' && (
        <Button
          variant="quiet"
          size="icon"
          className="w-7 h-7 text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--bg-tag)]"
          onClick={() => {}}
          aria-label="Скачать результат"
        >
          <Download size={14} />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="quiet"
            size="icon"
            className="w-7 h-7 text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--bg-tag)]"
            aria-label="Дополнительные действия"
          >
            <MoreHorizontal size={14} />
          </Button>
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
